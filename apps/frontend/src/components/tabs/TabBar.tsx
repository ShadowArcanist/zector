import { Plus, Server } from 'lucide-react';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { TabItem } from './TabItem';

export function TabBar() {
  const tabs = useLayoutStore((s) => s.tabs);
  const activeTabId = useLayoutStore((s) => s.activeTabId);
  const addTab = useLayoutStore((s) => s.addTab);
  const openConnections = useUiStore((s) => s.openConnections);

  return (
    <header className="flex h-10 shrink-0 items-center gap-1 border-b border-edge bg-bg0 px-2">
      <span className="mr-2 ml-1 text-[13px] font-bold tracking-widest text-accent select-none">
        zector
      </span>
      <div role="tablist" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} active={tab.id === activeTabId} />
        ))}
        <button
          type="button"
          aria-label="New tab"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-faint transition-colors hover:bg-bg2 hover:text-fg"
          onClick={addTab}
        >
          <Plus size={15} />
        </button>
      </div>
      <button
        type="button"
        className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs text-fg-dim transition-colors hover:bg-bg2 hover:text-fg"
        onClick={() => openConnections()}
      >
        <Server size={13} />
        Connections
      </button>
    </header>
  );
}
