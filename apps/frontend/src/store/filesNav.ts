import { create } from 'zustand';
import type { FsEntry } from '../api/types';
import { fsHome } from '../api/fs';
import { useLayoutStore } from './layout';
import { blockForLeaf } from './blocks';

/**
 * Ephemeral (never persisted) navigation state for files blocks: per-leaf
 * back/forward history, a per-target home directory cache (for `~` display),
 * a refresh nonce the block header's refresh button can bump, and the last
 * successful listing per leaf (rendered instantly on remount, e.g. after a
 * block move re-nests the panel tree, while a background refresh runs), and
 * the per-leaf open editor file (so the block header/back button see it).
 */
type NavStacks = { target: string; back: string[]; forward: string[] };

export type CachedListing = { key: string; entries: FsEntry[] };

/** File currently open in a files block's editor overlay. */
export type OpenFile = { target: string; path: string; name: string; size: number };

type OpenFileState = { file: OpenFile; dirty: boolean; confirmingClose: boolean };

type FilesNavStore = {
  nav: Record<string, NavStacks | undefined>;
  homes: Record<string, string | undefined>;
  refreshNonce: Record<string, number | undefined>;
  listings: Record<string, CachedListing | undefined>;
  /** Per-block (leafId) open editor file + dirty/close-confirm state. */
  openFiles: Record<string, OpenFileState | undefined>;
  /** Per-block (leafId) file-table column width overrides, colKey → px. */
  colWidths: Record<string, Record<string, number> | undefined>;
  openFile: (leafId: string, file: OpenFile) => void;
  closeFile: (leafId: string) => void;
  setFileDirty: (leafId: string, dirty: boolean) => void;
  /** Close the leaf's open file, but ask for confirmation first when dirty. */
  requestCloseFile: (leafId: string) => void;
  cancelCloseFile: (leafId: string) => void;
  recordVisit: (leafId: string, target: string, fromPath: string) => void;
  goBack: (leafId: string) => void;
  goForward: (leafId: string) => void;
  bumpRefresh: (leafId: string) => void;
  setHome: (target: string, home: string) => void;
  setListing: (leafId: string, listing: CachedListing) => void;
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
  listings: {},
  openFiles: {},
  colWidths: {},

  openFile: (leafId, file) =>
    set((s) => ({
      openFiles: { ...s.openFiles, [leafId]: { file, dirty: false, confirmingClose: false } },
    })),

  closeFile: (leafId) =>
    set((s) => {
      const openFiles = { ...s.openFiles };
      delete openFiles[leafId];
      return { openFiles };
    }),

  setFileDirty: (leafId, dirty) =>
    set((s) => {
      const cur = s.openFiles[leafId];
      if (!cur || cur.dirty === dirty) return s;
      return { openFiles: { ...s.openFiles, [leafId]: { ...cur, dirty } } };
    }),

  requestCloseFile: (leafId) => {
    const cur = get().openFiles[leafId];
    if (!cur) return;
    if (!cur.dirty) {
      get().closeFile(leafId);
      return;
    }
    set((s) => ({
      openFiles: { ...s.openFiles, [leafId]: { ...cur, confirmingClose: true } },
    }));
  },

  cancelCloseFile: (leafId) =>
    set((s) => {
      const cur = s.openFiles[leafId];
      if (!cur) return s;
      return { openFiles: { ...s.openFiles, [leafId]: { ...cur, confirmingClose: false } } };
    }),

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

  setListing: (leafId, listing) =>
    set((s) => ({ listings: { ...s.listings, [leafId]: listing } })),

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
