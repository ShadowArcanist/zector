import { create } from 'zustand';
import { fsHome } from '../api/fs';
import { useLayoutStore } from './layout';
import { blockForLeaf } from './blocks';

/**
 * Ephemeral (never persisted) navigation state for files blocks: per-leaf
 * back/forward history, a per-target home directory cache (for `~` display)
 * and a refresh nonce the block header's refresh button can bump.
 */
type NavStacks = { target: string; back: string[]; forward: string[] };

type FilesNavStore = {
  nav: Record<string, NavStacks | undefined>;
  homes: Record<string, string | undefined>;
  refreshNonce: Record<string, number | undefined>;
  /** Per-block (leafId) file-table column width overrides, colKey → px. */
  colWidths: Record<string, Record<string, number> | undefined>;
  recordVisit: (leafId: string, target: string, fromPath: string) => void;
  goBack: (leafId: string) => void;
  goForward: (leafId: string) => void;
  bumpRefresh: (leafId: string) => void;
  setHome: (target: string, home: string) => void;
  setColWidth: (leafId: string, colKey: string, px: number) => void;
  resetColWidth: (leafId: string, colKey: string) => void;
};

const emptyNav = (target: string): NavStacks => ({ target, back: [], forward: [] });

function filesBlockFor(leafId: string) {
  const block = blockForLeaf(leafId);
  return block?.kind === 'files' ? block : null;
}

export const useFilesNavStore = create<FilesNavStore>((set, get) => ({
  nav: {},
  homes: {},
  refreshNonce: {},
  colWidths: {},

  recordVisit: (leafId, target, fromPath) =>
    set((s) => {
      if (!fromPath) return s; // initial home resolution — nothing to go back to
      const cur = s.nav[leafId];
      const stacks = cur && cur.target === target ? cur : emptyNav(target);
      return {
        nav: { ...s.nav, [leafId]: { target, back: [...stacks.back, fromPath], forward: [] } },
      };
    }),

  goBack: (leafId) => {
    const block = filesBlockFor(leafId);
    const cur = get().nav[leafId];
    if (!block || !cur || cur.target !== block.target || cur.back.length === 0) return;
    const prev = cur.back[cur.back.length - 1];
    set((s) => ({
      nav: {
        ...s.nav,
        [leafId]: {
          target: cur.target,
          back: cur.back.slice(0, -1),
          forward: [...cur.forward, block.path],
        },
      },
    }));
    useLayoutStore.getState().updateLeafBlock(leafId, { ...block, path: prev });
  },

  goForward: (leafId) => {
    const block = filesBlockFor(leafId);
    const cur = get().nav[leafId];
    if (!block || !cur || cur.target !== block.target || cur.forward.length === 0) return;
    const next = cur.forward[cur.forward.length - 1];
    set((s) => ({
      nav: {
        ...s.nav,
        [leafId]: {
          target: cur.target,
          back: [...cur.back, block.path],
          forward: cur.forward.slice(0, -1),
        },
      },
    }));
    useLayoutStore.getState().updateLeafBlock(leafId, { ...block, path: next });
  },

  bumpRefresh: (leafId) =>
    set((s) => ({
      refreshNonce: { ...s.refreshNonce, [leafId]: (s.refreshNonce[leafId] ?? 0) + 1 },
    })),

  setHome: (target, home) => set((s) => ({ homes: { ...s.homes, [target]: home } })),

  setColWidth: (leafId, colKey, px) =>
    set((s) => ({
      colWidths: { ...s.colWidths, [leafId]: { ...s.colWidths[leafId], [colKey]: px } },
    })),

  resetColWidth: (leafId, colKey) =>
    set((s) => {
      const cur = { ...s.colWidths[leafId] };
      delete cur[colKey];
      return { colWidths: { ...s.colWidths, [leafId]: cur } };
    }),
}));

const homeFetches = new Set<string>();

/** Fetch and cache a target's home directory (best-effort, once per target). */
export function ensureHome(target: string) {
  if (useFilesNavStore.getState().homes[target] || homeFetches.has(target)) return;
  homeFetches.add(target);
  fsHome(target)
    .then((res) => useFilesNavStore.getState().setHome(target, res.path))
    .catch(() => homeFetches.delete(target));
}
