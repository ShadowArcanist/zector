import { useEffect } from 'react';
import { useLayoutStore } from './store/layout';
import { useConnectionsStore } from './store/connections';
import { useUiStore } from './store/ui';
import { TabBar } from './components/tabs/TabBar';
import { NodeView } from './components/layout/NodeView';
import { BlockDragGhost } from './components/layout/BlockDragGhost';
import { BlockPickerList, BlockPickerModal } from './components/blockpicker/BlockPicker';
import { ConnectionsModal } from './components/connections/ConnectionsModal';
import { ContextMenuHost } from './components/ui/ContextMenu';
import { Toasts } from './components/ui/Toasts';
import { Spinner } from './components/ui/Spinner';
import { Button } from './components/ui/Button';
import { PlusIcon } from './components/ui/icons/general';
import { BG_PRESETS } from './styles/bgPresets';

/** Active tab's Wave-style background preset, behind the tab bar and blocks. */
function WorkspaceBg() {
  const bgKey = useLayoutStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.bg);
  const preset = bgKey ? BG_PRESETS[bgKey] : undefined;
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
      <div className="w-[380px] rounded-[20px] border border-white/6 bg-bg1 shadow-modal">
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
  return <NodeView node={activeTab.root} />;
}

export default function App() {
  const init = useLayoutStore((s) => s.init);
  const loadConnections = useConnectionsStore((s) => s.load);
  const picker = useUiStore((s) => s.picker);
  const connectionsOpen = useUiStore((s) => s.connectionsOpen);

  useEffect(() => {
    void init();
    void loadConnections();
  }, [init, loadConnections]);

  return (
    <div className="relative flex h-full flex-col bg-bg0 text-fg">
      <WorkspaceBg />
      <TabBar />
      {/* Wave-style 3px gap around blocks */}
      <main className="relative min-h-0 flex-1 p-[3px]">
        <Workspace />
      </main>
      {picker && <BlockPickerModal />}
      {connectionsOpen && <ConnectionsModal />}
      <BlockDragGhost />
      <ContextMenuHost />
      <Toasts />
    </div>
  );
}
