import { Fragment, useState } from 'react';
import { Plus, Server } from 'lucide-react';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { openContextMenu } from '../../store/contextMenu';
import { TabItem } from './TabItem';

export function TabBar() {
  const tabs = useLayoutStore((s) => s.tabs);
  const activeTabId = useLayoutStore((s) => s.activeTabId);
  const addTab = useLayoutStore((s) => s.addTab);
  const openConnections = useUiStore((s) => s.openConnections);
  const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // divider is invisible when it touches the active or hovered tab
  const dividerHidden = (i: number) =>
    i === activeIndex || i - 1 === activeIndex || i === hoverIndex || i - 1 === hoverIndex;

  return (
    <header
      className="flex h-[33px] shrink-0 items-center gap-1 bg-black/35 pt-[3px] pr-1 pl-1.5 backdrop-blur-[20px]"
      onContextMenu={(e) =>
        openContextMenu(e, [{ label: 'New Tab', icon: <Plus size={13} />, onClick: addTab }])
      }
    >
      <div role="tablist" className="flex h-[27px] min-w-0 flex-1 items-center overflow-x-auto">
        {tabs.map((tab, i) => (
          <Fragment key={tab.id}>
            {i > 0 && (
              <div className={`h-3.5 w-px shrink-0 bg-white/20 ${dividerHidden(i) ? 'opacity-0' : ''}`} />
            )}
            <TabItem
              tab={tab}
              active={tab.id === activeTabId}
              onHoverChange={(h) => setHoverIndex(h ? i : null)}
            />
          </Fragment>
        ))}
        <button
          type="button"
          aria-label="New tab"
          className="ml-1 flex h-[22px] shrink-0 cursor-pointer items-center justify-center rounded-md px-2 text-fg-dim transition-colors hover:bg-hover hover:text-fg"
          onClick={addTab}
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        type="button"
        title="Connections"
        aria-label="Connections"
        className="flex h-[24px] w-[24px] shrink-0 cursor-pointer items-center justify-center text-fg-dim opacity-70 transition-opacity hover:opacity-100"
        onClick={() => openConnections()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <Server size={14} />
      </button>
    </header>
  );
}
