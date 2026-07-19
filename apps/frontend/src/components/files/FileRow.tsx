import { useEffect, useRef, useState } from 'react';
import { File, Folder, Link2 } from 'lucide-react';
import type { FsEntry } from '../../api/types';
import { COL, formatModified, MIN_ROW_CLASS, permString, typeLabel } from './columns';
import { humanSize } from './format';

type Props = {
  entry: FsEntry;
  isParent: boolean; // the synthetic ".." row
  selected: boolean;
  renaming: boolean;
  onSelect: (entry: FsEntry) => void;
  onOpen: (entry: FsEntry) => void;
  onContextMenu: (entry: FsEntry, e: React.MouseEvent) => void;
  onRenameCommit: (entry: FsEntry, newName: string) => void;
  onRenameCancel: () => void;
};

function EntryIcon({ entry }: { entry: FsEntry }) {
  if (entry.is_symlink) return <Link2 size={14} className="shrink-0 text-fg-faint" />;
  if (entry.is_dir) return <Folder size={14} className="shrink-0 text-accent/80" />;
  return <File size={14} className="shrink-0 text-fg-faint" />;
}

export function RenameInput({
  initial,
  placeholder,
  onCommit,
  onCancel,
}: {
  initial: string;
  placeholder?: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      value={draft}
      placeholder={placeholder}
      className="h-5 w-full min-w-0 rounded-[2px] border border-white/18 bg-black/30 px-1 text-[12px] text-fg outline-none placeholder:text-fg-faint focus:border-accent"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={onCancel}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          const name = draft.trim();
          if (name && name !== initial) onCommit(name);
          else onCancel();
        }
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

/** One ~24px table row; cell widths mirror COLUMNS in columns.ts. */
export function FileRow({
  entry,
  isParent,
  selected,
  renaming,
  onSelect,
  onOpen,
  onContextMenu,
  onRenameCommit,
  onRenameCancel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);
  const metaCls = selected ? 'text-fg-dim' : 'text-fg-faint';

  return (
    <div
      ref={ref}
      className={`flex h-6 shrink-0 cursor-default items-center px-2 text-[12px] select-none ${MIN_ROW_CLASS} ${
        selected ? 'bg-accent/30 text-fg' : 'text-fg-dim hover:bg-white/8'
      }`}
      onClick={() => onSelect(entry)}
      onDoubleClick={() => onOpen(entry)}
      onContextMenu={isParent ? undefined : (e) => onContextMenu(entry, e)}
    >
      <span className={`flex items-center gap-2 ${COL.name}`}>
        <EntryIcon entry={entry} />
        <span className="min-w-0 flex-1 truncate">
          {renaming ? (
            <RenameInput
              initial={entry.name}
              onCommit={(name) => onRenameCommit(entry, name)}
              onCancel={onRenameCancel}
            />
          ) : (
            entry.name
          )}
        </span>
      </span>
      <span className={`truncate font-mono text-[11px] ${metaCls} ${COL.perm}`}>
        {isParent ? '' : permString(entry)}
      </span>
      <span className={`truncate font-mono text-[11px] ${metaCls} ${COL.modified}`}>
        {isParent ? '' : formatModified(entry.modified)}
      </span>
      <span className={`font-mono text-[11px] ${metaCls} ${COL.size}`}>
        {entry.is_dir ? '' : humanSize(entry.size)}
      </span>
      <span className={`truncate text-[11px] ${metaCls} ${COL.type}`}>{typeLabel(entry)}</span>
    </div>
  );
}
