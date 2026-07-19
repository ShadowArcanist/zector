import { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import type { Tab } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { openContextMenu } from '../../store/contextMenu';

export function TabItem({ tab, active }: { tab: Tab; active: boolean }) {
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const closeTab = useLayoutStore((s) => s.closeTab);
  const renameTab = useLayoutStore((s) => s.renameTab);
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
      className="group h-[27px] max-w-[130px] min-w-[100px] flex-[0_1_130px] cursor-pointer px-[3px] py-[1.5px] select-none"
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
          { label: 'Rename Tab', icon: <Pencil size={13} />, onClick: startRename },
          'separator',
          { label: 'Close Tab', icon: <X size={13} />, onClick: () => closeTab(tab.id) },
        ])
      }
    >
      <div
        className={`relative flex h-6 w-full items-center justify-center rounded-md transition-colors ${
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
            className="w-[calc(100%-14px)] rounded-[2px] border border-white/18 bg-transparent px-1.5 py-0.5 text-center text-[11px] font-medium text-fg outline-none"
          />
        ) : (
          <span
            className={`max-w-[calc(100%-10px)] truncate px-1 text-center text-[11px] ${
              active ? 'font-semibold text-white' : 'font-medium text-fg-dim'
            }`}
          >
            {tab.name}
          </span>
        )}
        <button
          type="button"
          aria-label={`Close ${tab.name}`}
          className="invisible absolute top-1/2 right-1 flex h-5 w-5 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center text-fg-faint hover:text-fg group-hover:visible"
          onClick={(e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
