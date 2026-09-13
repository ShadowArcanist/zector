import { lazy, Suspense, useEffect } from 'react';
import { useLayoutStore } from './store/layout';
import { loadConfig, useConfigStore } from './store/config';
import { useConnectionsStore } from './store/connections';
import { useUiStore } from './store/ui';
import { TabBar } from './components/tabs/TabBar';
import { NodeView } from './components/layout/NodeView';
import { BlockDragGhost } from './components/layout/BlockDragGhost';
import { BlockPickerList, BlockPickerModal } from './components/blockpicker/BlockPicker';
import { ContextMenuHost } from './components/ui/ContextMenu';
import { Toasts } from './components/ui/Toasts';
import { Spinner } from './components/ui/Spinner';
import { Button } from './components/ui/Button';
import { PlusIcon } from './components/ui/icons/general';

// Modals mount only when their open flag flips, so keep them out of the initial chunk.
// BlockPickerModal stays static: its module also exports BlockPickerList, used eagerly below.
const ConnectionsModal = lazy(() =>
  import('./components/connections/ConnectionsModal').then((m) => ({ default: m.ConnectionsModal })),
);
const CommandPalette = lazy(() =>
  import('./components/command/CommandPalette').then((m) => ({ default: m.CommandPalette })),
);

/** Fallback accent when the active tab has no background (matches global.css). */
const DEFAULT_ACCENT = '#4c8dff';

/** Active tab's Wave-style background preset, behind the tab bar and blocks. */
function WorkspaceBg() {
  const bgKey = useLayoutStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.bg);
  // unknown key (e.g. removed from the config file): render no background
  const preset = useConfigStore((s) =>
    bgKey ? s.backgrounds.find((b) => b.key === bgKey) : undefined,
  );

  // Background-driven accent: draggers, selections, focus rings follow the preset.
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', preset?.accent ?? DEFAULT_ACCENT);
  }, [preset]);

  if (!preset) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: preset.bg, opacity: preset.opacity }}
    />
  );
}

function EmptyTabPicker({ tabId }: { tabId: string }) {
  const setTabRoot = useLayoutStore((s) => s.setTabRoot);
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-[380px] rounded-[20px] border border-white/6 bg-menu shadow-modal">
        <p className="px-5 pt-4 pb-2 text-[16px] font-semibold text-fg">Add a block</p>
        <BlockPickerList onPick={(block) => setTabRoot(tabId, block)} />
      </div>
    </div>
  );
}

function Workspace() {
  const loaded = useLayoutStore((s) => s.loaded);
  const activeTab = useLayoutStore((s) => s.tabs.find((t) => t.id === s.activeTabId) ?? null);
  const addTab = useLayoutStore((s) => s.addTab);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={20} />
      </div>
    );
  }
  if (!activeTab) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-[13px] text-fg-faint">No tabs open</p>
        <Button variant="primary" onClick={addTab}>
          <PlusIcon size={14} />
          New tab
        </Button>
      </div>
    );
  }
  if (!activeTab.root) return <EmptyTabPicker tabId={activeTab.id} />;
  // Tabs are separate React trees. The key prevents the previous tab's xterm
  // canvas from being reused for one frame while the next one connects.
  return <NodeView key={activeTab.id} node={activeTab.root} />;
}

export default function App() {
  const init = useLayoutStore((s) => s.init);
  const loadConnections = useConnectionsStore((s) => s.load);
  const picker = useUiStore((s) => s.picker);
  const connectionsOpen = useUiStore((s) => s.connectionsOpen);
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen);
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    void loadConfig(); // parallel with init; init joins it before parsing
    void init();
    void loadConnections();
  }, [init, loadConnections]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleCommandPalette]);

  return (
    <div className="relative flex h-full flex-col bg-bg0 text-fg">
      <WorkspaceBg />
      <TabBar />
      {/* Wave-style 3px gap around blocks */}
      <main className="relative min-h-0 flex-1 p-[3px]">
        <Workspace />
      </main>
      {picker && <BlockPickerModal />}
      <Suspense fallback={null}>
        {connectionsOpen && <ConnectionsModal />}
        {commandPaletteOpen && <CommandPalette />}
      </Suspense>
      <BlockDragGhost />
      <ContextMenuHost />
      <Toasts />
    </div>
  );
}
