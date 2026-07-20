import type { Tab, UiState } from '../api/types';
import { putUiState } from '../api/state';
import { useConfigStore } from './config';
import { isValidNode, makeLeaf, uuid } from './tree';

/** Persistence helpers for the layout store (parse + debounced save). */

export function defaultTab(index: number): Tab {
  return {
    id: uuid(),
    name: `Tab ${index}`,
    root: makeLeaf({ kind: 'terminal', target: 'local', termId: uuid() }),
    bg: useConfigStore.getState().settings.tabPreset ?? undefined,
  };
}

export function parseUiState(raw: unknown): UiState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const state = raw as Record<string, unknown>;
  if (!Array.isArray(state.tabs) || state.tabs.length === 0) return null;
  const backgrounds = useConfigStore.getState().backgrounds;
  const tabs: Tab[] = [];
  for (const t of state.tabs) {
    const tab = t as Record<string, unknown>;
    if (typeof tab.id !== 'string' || typeof tab.name !== 'string') return null;
    const root = tab.root === null || tab.root === undefined ? null : tab.root;
    if (root !== null && !isValidNode(root)) return null;
    const bg =
      typeof tab.bg === 'string' && backgrounds.some((b) => b.key === tab.bg)
        ? tab.bg
        : undefined;
    tabs.push({ id: tab.id, name: tab.name, root: root === null ? null : root, bg });
  }
  const active = typeof state.activeTabId === 'string' ? state.activeTabId : null;
  const localName =
    typeof state.localName === 'string' && state.localName.trim()
      ? state.localName
      : undefined;
  const localIcon = typeof state.localIcon === 'string' ? state.localIcon : undefined;
  const localColor = typeof state.localColor === 'string' ? state.localColor : undefined;
  const localConnectionIndex =
    typeof state.localConnectionIndex === 'number' &&
    Number.isInteger(state.localConnectionIndex) &&
    state.localConnectionIndex >= 0
      ? state.localConnectionIndex
      : undefined;
  const hiddenFileColumns = Array.isArray(state.hiddenFileColumns)
    ? state.hiddenFileColumns.filter((c): c is string => typeof c === 'string')
    : undefined;
  return {
    tabs,
    activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id,
    localName,
    localIcon,
    localColor,
    localConnectionIndex,
    hiddenFileColumns,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;

export function schedulePersist(get: () => UiState) {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const {
      tabs,
      activeTabId,
      localName,
      localIcon,
      localColor,
      localConnectionIndex,
      hiddenFileColumns,
    } = get();
    putUiState({
      tabs,
      activeTabId,
      localName,
      localIcon,
      localColor,
      localConnectionIndex,
      hiddenFileColumns,
    }).catch(() => {
      // quiet: layout persistence is best-effort while the backend is down
    });
  }, 500);
}
