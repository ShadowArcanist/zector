import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Tab } from '../../api/types';
import { useLayoutStore } from '../../store/layout';

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

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== tab.name) renameTab(tab.id, name);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(tab.name);
            setEditing(false);
          }
        }}
        className="h-7 w-28 rounded-md border border-accent-dim bg-bg2 px-2 text-[13px] text-fg outline-none"
      />
    );
  }

  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={0}
      className={`group flex h-7 max-w-44 min-w-0 cursor-pointer items-center gap-1 rounded-md pr-1 pl-3 text-[13px] transition-colors select-none ${
        active ? 'bg-bg3 text-fg' : 'text-fg-dim hover:bg-bg2 hover:text-fg'
      }`}
      onClick={() => setActiveTab(tab.id)}
      onDoubleClick={() => {
        setDraft(tab.name);
        setEditing(true);
      }}
      onAuxClick={(e) => {
        if (e.button === 1) closeTab(tab.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setActiveTab(tab.id);
      }}
    >
      <span className="truncate">{tab.name}</span>
      <button
        type="button"
        aria-label={`Close ${tab.name}`}
        className={`ml-0.5 flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded text-fg-faint transition-opacity hover:bg-bg1 hover:text-fg ${
          active ? 'opacity-70' : 'opacity-0 group-hover:opacity-70'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          closeTab(tab.id);
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
