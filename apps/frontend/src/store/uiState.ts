import type { Tab, UiState } from '../api/types';
import { putUiState } from '../api/state';
import { BG_PRESETS } from '../styles/bgPresets';
import { isValidNode, makeLeaf, uuid } from './tree';

/** Persistence helpers for the layout store (parse + debounced save). */

export function defaultTab(index: number): Tab {
  return {
    id: uuid(),
    name: `Tab ${index}`,
    root: makeLeaf({ kind: 'terminal', target: 'local', termId: uuid() }),
  };
}

export function parseUiState(raw: unknown): UiState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const state = raw as Record<string, unknown>;
  if (!Array.isArray(state.tabs) || state.tabs.length === 0) return null;
  const tabs: Tab[] = [];
  for (const t of state.tabs) {
    const tab = t as Record<string, unknown>;
    if (typeof tab.id !== 'string' || typeof tab.name !== 'string') return null;
    const root = tab.root === null || tab.root === undefined ? null : tab.root;
    if (root !== null && !isValidNode(root)) return null;
    const bg = typeof tab.bg === 'string' && tab.bg in BG_PRESETS ? tab.bg : undefined;
    tabs.push({ id: tab.id, name: tab.name, root: root === null ? null : root, bg });
  }
  const active = typeof state.activeTabId === 'string' ? state.activeTabId : null;
  const localName =
    typeof state.localName === 'string' && state.localName.trim()
      ? state.localName
      : undefined;
  return {
    tabs,
    activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id,
    localName,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;

export function schedulePersist(get: () => UiState) {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { tabs, activeTabId, localName } = get();
    putUiState({ tabs, activeTabId, localName }).catch(() => {
      // quiet: layout persistence is best-effort while the backend is down
    });
  }, 500);
}
