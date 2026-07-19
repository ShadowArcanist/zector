import { Fragment, useState } from 'react';
import { Palette, Plus, Server } from 'lucide-react';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { openContextMenu, type MenuEntry } from '../../store/contextMenu';
import { DEFAULT_UI_THEME, UI_THEMES } from '../../styles/uiThemes';
import { TabItem } from './TabItem';

export function TabBar() {
  const tabs = useLayoutStore((s) => s.tabs);
  const activeTabId = useLayoutStore((s) => s.activeTabId);
  const addTab = useLayoutStore((s) => s.addTab);
  const openConnections = useUiStore((s) => s.openConnections);
  const uiTheme = useLayoutStore((s) => s.uiTheme);
  const setUiTheme = useLayoutStore((s) => s.setUiTheme);
  const themeItems: MenuEntry[] = Object.entries(UI_THEMES).map(([key, t]) => ({
    label: t.name,
    checked: key === (uiTheme ?? DEFAULT_UI_THEME),
    onClick: () => setUiTheme(key),
  }));
  const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // divider is invisible when it touches the active or hovered tab
  const dividerHidden = (i: number) =>
    i === activeIndex || i - 1 === activeIndex || i === hoverIndex || i - 1 === hoverIndex;

  return (
    <header
      className="mx-[3px] mt-[3px] flex h-[33px] shrink-0 items-center gap-1 rounded-lg bg-black/35 pr-1 pl-1.5 backdrop-blur-[20px]"
      onContextMenu={(e) =>
        openContextMenu(e, [
          { label: 'New Tab', icon: <Plus size={13} />, onClick: addTab },
          'separator',
          { label: 'UI Theme', icon: <Palette size={13} />, submenu: themeItems },
        ])
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
        title="UI theme"
        aria-label="UI theme"
        className="flex h-[24px] w-[24px] shrink-0 cursor-pointer items-center justify-center text-fg-dim opacity-70 transition-opacity hover:opacity-100"
        onClick={(e) => openContextMenu(e, themeItems)}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <Palette size={14} />
      </button>
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
