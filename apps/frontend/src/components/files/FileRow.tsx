import { useEffect, useRef, useState } from 'react';
import { LinkIcon } from '../ui/icons/files';
import type { FsEntry } from '../../api/types';
import {
  formatModified,
  NAME_MIN_WIDTH,
  permString,
  rowMinWidth,
  typeLabel,
  type ColWidths,
  type FixedColKey,
} from './columns';
import { fileIconUrl } from './fileIcons';
import { humanSize } from './format';

type Props = {
  entry: FsEntry;
  widths: ColWidths;
  hidden: ReadonlySet<FixedColKey>;
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
  if (entry.is_symlink) return <LinkIcon size={14} className="shrink-0 text-fg-faint" />;
  return (
    <img
      src={fileIconUrl(entry.name, entry.is_dir)}
      width={14}
      height={14}
      className="shrink-0"
      alt=""
      loading="lazy"
      draggable={false}
    />
  );
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
  widths,
  hidden,
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
  // meta cells stay a step dimmer than the bright name, but clearly readable
  const metaCls = 'text-fg-dim';

  return (
    <div
      ref={ref}
      className={`flex h-6 shrink-0 cursor-default items-center px-2 text-[12px] select-none ${
        selected ? 'bg-accent/30 text-fg' : 'text-fg-dim hover:bg-white/8'
      }`}
      style={{ minWidth: rowMinWidth(widths, hidden) }}
      onClick={() => onSelect(entry)}
      onDoubleClick={() => onOpen(entry)}
      onContextMenu={isParent ? undefined : (e) => onContextMenu(entry, e)}
    >
      <span className="flex flex-1 items-center gap-2" style={{ minWidth: NAME_MIN_WIDTH }}>
        <EntryIcon entry={entry} />
        <span className="min-w-0 flex-1 truncate text-fg">
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
      {!hidden.has('perm') && (
        <span
          className={`shrink-0 truncate font-mono text-[11px] ${metaCls}`}
          style={{ width: widths.perm }}
        >
          {isParent ? '' : permString(entry)}
        </span>
      )}
      {!hidden.has('modified') && (
        <span
          className={`shrink-0 truncate font-mono text-[11px] ${metaCls}`}
          style={{ width: widths.modified }}
        >
          {isParent ? '' : formatModified(entry.modified)}
        </span>
      )}
      {!hidden.has('size') && (
        <span
          className={`shrink-0 text-right font-mono text-[11px] ${metaCls}`}
          style={{ width: widths.size }}
        >
          {entry.is_dir ? '' : humanSize(entry.size)}
        </span>
      )}
      {!hidden.has('type') && (
        <span
          className={`shrink-0 truncate pl-3 text-[11px] ${metaCls}`}
          style={{ width: widths.type }}
        >
          {typeLabel(entry)}
        </span>
      )}
    </div>
  );
}
