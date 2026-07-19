import { useEffect, useRef, useState } from 'react';
import { File, FileText, Folder, Image as ImageIcon, Link2 } from 'lucide-react';
import type { FsEntry } from '../../api/types';
import { formatModified, humanSize, isImageFile, isTextFile } from './format';

type Props = {
  entries: FsEntry[];
  selected: string | null; // entry path
  renaming: string | null; // entry path being renamed inline
  onSelect: (entry: FsEntry) => void;
  onOpen: (entry: FsEntry) => void;
  onContextMenu: (entry: FsEntry, e: React.MouseEvent) => void;
  onRenameCommit: (entry: FsEntry, newName: string) => void;
  onRenameCancel: () => void;
};

function EntryIcon({ entry }: { entry: FsEntry }) {
  const cls = 'shrink-0';
  if (entry.is_dir) return <Folder size={14} className={`${cls} text-accent/80`} />;
  if (entry.is_symlink) return <Link2 size={14} className={`${cls} text-fg-faint`} />;
  if (isImageFile(entry.name)) return <ImageIcon size={14} className={`${cls} text-fg-faint`} />;
  if (isTextFile(entry.name, entry.size)) return <FileText size={14} className={`${cls} text-fg-faint`} />;
  return <File size={14} className={`${cls} text-fg-faint`} />;
}

function RenameInput({ entry, onCommit, onCancel }: { entry: FsEntry; onCommit: (name: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(entry.name);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      value={draft}
      className="h-5.5 w-full min-w-0 rounded-[2px] border border-white/18 bg-black/30 px-1 text-[12px] text-fg outline-none focus:border-accent"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={onCancel}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const name = draft.trim();
          if (name && name !== entry.name) onCommit(name);
          else onCancel();
        }
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

export function FileList({
  entries,
  selected,
  renaming,
  onSelect,
  onOpen,
  onContextMenu,
  onRenameCommit,
  onRenameCancel,
}: Props) {
  if (entries.length === 0) {
    return <p className="px-4 py-6 text-center text-xs text-fg-faint select-none">Empty directory</p>;
  }
  return (
    <div className="flex flex-col py-0.5">
      {entries.map((entry) => (
        <div
          key={entry.path}
          className={`mx-1 flex h-6.5 cursor-default items-center gap-2 rounded px-2 select-none ${
            selected === entry.path ? 'bg-highlight text-fg' : 'text-fg-dim hover:bg-hover'
          }`}
          onClick={() => onSelect(entry)}
          onDoubleClick={() => onOpen(entry)}
          onContextMenu={(e) => onContextMenu(entry, e)}
        >
          <EntryIcon entry={entry} />
          <span className="min-w-0 flex-1 truncate text-[12px]">
            {renaming === entry.path ? (
              <RenameInput entry={entry} onCommit={(name) => onRenameCommit(entry, name)} onCancel={onRenameCancel} />
            ) : (
              entry.name
            )}
          </span>
          <span className="w-16 shrink-0 text-right font-mono text-[11px] text-fg-faint">
            {entry.is_dir ? '—' : humanSize(entry.size)}
          </span>
          <span className="hidden w-20 shrink-0 text-right font-mono text-[11px] text-fg-faint sm:block">
            {formatModified(entry.modified)}
          </span>
        </div>
      ))}
    </div>
  );
}
