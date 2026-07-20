import { useEffect, useRef, useState } from 'react';
import { CloseIcon, EditIcon, WallpaperIcon } from '../ui/icons/general';
import type { Tab } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { useConfigStore } from '../../store/config';
import { openContextMenu, type MenuEntry } from '../../store/contextMenu';

export function TabItem({
  tab,
  active,
  onHoverChange,
}: {
  tab: Tab;
  active: boolean;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const closeTab = useLayoutStore((s) => s.closeTab);
  const renameTab = useLayoutStore((s) => s.renameTab);
  const setTabBg = useLayoutStore((s) => s.setTabBg);
  const backgrounds = useConfigStore((s) => s.backgrounds);
  const bgItems: MenuEntry[] = [
    { label: 'Default', checked: !tab.bg, onClick: () => setTabBg(tab.id, undefined) },
    'separator',
    ...backgrounds.map((b) => ({
      label: b.name,
      checked: tab.bg === b.key,
      onClick: () => setTabBg(tab.id, b.key),
    })),
  ];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tab.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startRename = () => {
    setDraft(tab.name);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== tab.name) renameTab(tab.id, name);
  };

  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={0}
      className="group h-[27px] w-fit max-w-[220px] min-w-[60px] flex-none cursor-pointer px-px py-[1.5px] select-none"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onClick={() => setActiveTab(tab.id)}
      onDoubleClick={startRename}
      onAuxClick={(e) => {
        if (e.button === 1) closeTab(tab.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setActiveTab(tab.id);
      }}
      onContextMenu={(e) =>
        openContextMenu(e, [
          { label: 'Rename Tab', icon: <EditIcon size={14} />, onClick: startRename },
          { label: 'Themes', icon: <WallpaperIcon size={14} />, submenu: bgItems },
          'separator',
          { label: 'Close Tab', icon: <CloseIcon size={14} />, onClick: () => closeTab(tab.id) },
        ])
      }
    >
      {/* px matches the hover-only close button so it never covers the name */}
      <div
        className={`relative flex h-6 w-full items-center justify-center rounded-md px-[18px] transition-colors ${
          active ? 'bg-white/10' : 'group-hover:bg-white/10'
        }`}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(tab.name);
                setEditing(false);
              }
            }}
            className="w-[110px] rounded-[2px] border border-white/18 bg-transparent px-1.5 py-0.5 text-center text-[11px] font-medium text-fg outline-none"
          />
        ) : (
          <span
            className={`min-w-0 truncate text-center text-[11px] whitespace-nowrap ${
              active ? 'font-semibold text-white' : 'font-medium text-fg-dim'
            }`}
          >
            {tab.name}
          </span>
        )}
        <button
          type="button"
          aria-label={`Close ${tab.name}`}
          className="invisible absolute top-1/2 right-0.5 flex h-5 w-4 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center text-fg-faint hover:text-fg group-hover:visible"
          onClick={(e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }}
        >
          <CloseIcon size={12} />
        </button>
      </div>
    </div>
  );
}
