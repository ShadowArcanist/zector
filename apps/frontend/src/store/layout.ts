import { create } from 'zustand';
import type { Block, Tab, UiState } from '../api/types';
import { getUiState } from '../api/state';
import { killTerm } from '../api/term';
import { applyUiTheme } from '../styles/uiThemes';
import { pushToast } from './toast';
import {
  collectTermIds,
  firstLeafId,
  makeLeaf,
  moveLeafInTree,
  removeLeafFromTree,
  setSizesInTree,
  splitLeafInTree,
  updateLeafBlockInTree,
  uuid,
  type DropEdge,
} from './tree';
import { defaultTab, parseUiState, schedulePersist } from './uiState';

type LayoutStore = UiState & {
  loaded: boolean;
  focusedLeafId: string | null;
  init: () => Promise<void>;
  addTab: () => void;
  closeTab: (tabId: string) => void;
  renameTab: (tabId: string, name: string) => void;
  setTabBg: (tabId: string, bg: string | undefined) => void;
  setActiveTab: (tabId: string) => void;
  setTabRoot: (tabId: string, block: Block) => void;
  splitLeaf: (leafId: string, dir: 'row' | 'col', newBlock: Block) => void;
  moveLeaf: (srcLeafId: string, targetLeafId: string, edge: DropEdge) => void;
  closeLeaf: (leafId: string) => void;
  updateLeafBlock: (leafId: string, block: Block) => void;
  setSizes: (splitId: string, sizes: number[]) => void;
  setFocusedLeaf: (leafId: string | null) => void;
  setUiTheme: (key: string) => void;
  setLocalName: (name: string) => void;
};

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
      const activeRoot = ui.tabs.find((t) => t.id === ui.activeTabId)?.root ?? null;
      applyUiTheme(ui.uiTheme);
      set({ ...ui, loaded: true, focusedLeafId: firstLeafId(activeRoot) });
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

    setTabBg: (tabId, bg) =>
      mutate((s) => ({
        tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, bg } : t)),
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

    moveLeaf: (srcLeafId, targetLeafId, edge) =>
      mutate((s) => {
        let moved = false;
        const tabs = s.tabs.map((t) => {
          if (!t.root) return t;
          const root = moveLeafInTree(t.root, srcLeafId, targetLeafId, edge);
          if (root === t.root) return t;
          moved = true;
          return { ...t, root };
        });
        return moved ? { tabs, focusedLeafId: srcLeafId } : { tabs };
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

    setUiTheme: (key) =>
      mutate(() => {
        applyUiTheme(key);
        return { uiTheme: key };
      }),

    setLocalName: (name) => mutate(() => ({ localName: name.trim() || undefined })),
  };
});
