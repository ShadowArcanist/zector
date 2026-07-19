import { create } from 'zustand';
import type { Block, Tab, UiState } from '../api/types';
import { getUiState, putUiState } from '../api/state';
import { killTerm } from '../api/term';
import { pushToast } from './toast';
import {
  collectTermIds,
  firstLeafId,
  isValidNode,
  makeLeaf,
  removeLeafFromTree,
  setSizesInTree,
  splitLeafInTree,
  updateLeafBlockInTree,
  uuid,
} from './tree';

type LayoutStore = UiState & {
  loaded: boolean;
  focusedLeafId: string | null;
  init: () => Promise<void>;
  addTab: () => void;
  closeTab: (tabId: string) => void;
  renameTab: (tabId: string, name: string) => void;
  setActiveTab: (tabId: string) => void;
  setTabRoot: (tabId: string, block: Block) => void;
  splitLeaf: (leafId: string, dir: 'row' | 'col', newBlock: Block) => void;
  closeLeaf: (leafId: string) => void;
  updateLeafBlock: (leafId: string, block: Block) => void;
  setSizes: (splitId: string, sizes: number[]) => void;
  setFocusedLeaf: (leafId: string | null) => void;
};

function defaultTab(index: number): Tab {
  return {
    id: uuid(),
    name: `Tab ${index}`,
    root: makeLeaf({ kind: 'terminal', target: 'local', termId: uuid() }),
  };
}

function parseUiState(raw: unknown): UiState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const state = raw as Record<string, unknown>;
  if (!Array.isArray(state.tabs) || state.tabs.length === 0) return null;
  const tabs: Tab[] = [];
  for (const t of state.tabs) {
    const tab = t as Record<string, unknown>;
    if (typeof tab.id !== 'string' || typeof tab.name !== 'string') return null;
    const root = tab.root === null || tab.root === undefined ? null : tab.root;
    if (root !== null && !isValidNode(root)) return null;
    tabs.push({ id: tab.id, name: tab.name, root: root === null ? null : root });
  }
  const active = typeof state.activeTabId === 'string' ? state.activeTabId : null;
  return {
    tabs,
    activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;
function schedulePersist(get: () => LayoutStore) {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { tabs, activeTabId } = get();
    putUiState({ tabs, activeTabId }).catch(() => {
      // quiet: layout persistence is best-effort while the backend is down
    });
  }, 500);
}

function killTree(root: Tab['root']) {
  for (const id of collectTermIds(root)) killTerm(id).catch(() => {});
}

export const useLayoutStore = create<LayoutStore>((set, get) => {
  const mutate = (fn: (s: LayoutStore) => Partial<LayoutStore>) => {
    set(fn);
    schedulePersist(get);
  };

  return {
    tabs: [],
    activeTabId: null,
    loaded: false,
    focusedLeafId: null,

    init: async () => {
      let ui: UiState | null = null;
      try {
        ui = parseUiState(await getUiState());
      } catch {
        pushToast('error', 'Could not load saved layout — backend unreachable');
      }
      if (!ui) {
        const tab = defaultTab(1);
        ui = { tabs: [tab], activeTabId: tab.id };
      }
      set({ ...ui, loaded: true, focusedLeafId: firstLeafId(ui.tabs[0]?.root ?? null) });
    },

    addTab: () =>
      mutate((s) => {
        const tab: Tab = { id: uuid(), name: `Tab ${s.tabs.length + 1}`, root: null };
        return { tabs: [...s.tabs, tab], activeTabId: tab.id, focusedLeafId: null };
      }),

    closeTab: (tabId) =>
      mutate((s) => {
        const closing = s.tabs.find((t) => t.id === tabId);
        if (closing) killTree(closing.root);
        const tabs = s.tabs.filter((t) => t.id !== tabId);
        let activeTabId = s.activeTabId;
        if (activeTabId === tabId) {
          const idx = s.tabs.findIndex((t) => t.id === tabId);
          activeTabId = tabs[Math.max(0, idx - 1)]?.id ?? null;
        }
        return { tabs, activeTabId };
      }),

    renameTab: (tabId, name) =>
      mutate((s) => ({
        tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, name: name || t.name } : t)),
      })),

    setActiveTab: (tabId) =>
      mutate((s) => ({
        activeTabId: tabId,
        focusedLeafId: firstLeafId(s.tabs.find((t) => t.id === tabId)?.root ?? null),
      })),

    setTabRoot: (tabId, block) =>
      mutate((s) => {
        const leaf = makeLeaf(block);
        return {
          tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, root: leaf } : t)),
          focusedLeafId: leaf.id,
        };
      }),

    splitLeaf: (leafId, dir, newBlock) =>
      mutate((s) => {
        const leaf = makeLeaf(newBlock);
        return {
          tabs: s.tabs.map((t) =>
            t.root ? { ...t, root: splitLeafInTree(t.root, leafId, dir, leaf) } : t,
          ),
          focusedLeafId: leaf.id,
        };
      }),

    closeLeaf: (leafId) =>
      mutate((s) => {
        const tabs = s.tabs.map((t) => {
          if (!t.root) return t;
          const before = collectTermIds(t.root);
          const root = removeLeafFromTree(t.root, leafId);
          if (root !== t.root) {
            const after = new Set(collectTermIds(root));
            for (const id of before) if (!after.has(id)) killTerm(id).catch(() => {});
          }
          return root === t.root ? t : { ...t, root };
        });
        const focusedLeafId =
          s.focusedLeafId === leafId
            ? firstLeafId(tabs.find((t) => t.id === s.activeTabId)?.root ?? null)
            : s.focusedLeafId;
        return { tabs, focusedLeafId };
      }),

    updateLeafBlock: (leafId, block) =>
      mutate((s) => ({
        tabs: s.tabs.map((t) =>
          t.root ? { ...t, root: updateLeafBlockInTree(t.root, leafId, block) } : t,
        ),
      })),

    setSizes: (splitId, sizes) =>
      mutate((s) => ({
        tabs: s.tabs.map((t) =>
          t.root ? { ...t, root: setSizesInTree(t.root, splitId, sizes) } : t,
        ),
      })),

    setFocusedLeaf: (leafId) => set({ focusedLeafId: leafId }),
  };
});
