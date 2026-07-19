import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FolderPlus } from 'lucide-react';
import type { FsEntry } from '../../api/types';
import { COLUMNS, compareEntries, DEFAULT_SORT, MIN_ROW_CLASS, type SortState } from './columns';
import { parentPath } from './format';
import { FileRow, RenameInput } from './FileRow';

type Props = {
  path: string;
  entries: FsEntry[];
  selected: string | null; // entry path
  renaming: string | null; // entry path being renamed inline
  creatingFolder: boolean;
  onSelect: (entry: FsEntry | null) => void;
  onOpen: (entry: FsEntry) => void;
  onEntryMenu: (entry: FsEntry, e: React.MouseEvent) => void;
  onEmptyMenu: (e: React.MouseEvent) => void;
  onRenameCommit: (entry: FsEntry, newName: string) => void;
  onRenameCancel: () => void;
  onMkdir: (name: string) => void;
  onMkdirCancel: () => void;
};

function parentEntry(path: string): FsEntry {
  return { name: '..', path: parentPath(path), is_dir: true, is_symlink: false, size: 0, modified: null };
}

/** Wave-style directory table: sticky sortable headers, ".." row, keyboard nav. */
export function FileTable({
  path,
  entries,
  selected,
  renaming,
  creatingFolder,
  onSelect,
  onOpen,
  onEntryMenu,
  onEmptyMenu,
  onRenameCommit,
  onRenameCancel,
  onMkdir,
  onMkdirCancel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const atRoot = path === '/' || path === '';
  const rows: FsEntry[] = [
    ...(atRoot ? [] : [parentEntry(path)]),
    ...[...entries].sort((a, b) => compareEntries(a, b, sort)),
  ];

  const toggleSort = (key: SortState['key']) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (rows.length === 0) return;
      const idx = rows.findIndex((r) => r.path === selected);
      const next =
        idx === -1
          ? e.key === 'ArrowDown' ? 0 : rows.length - 1
          : Math.min(rows.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)));
      onSelect(rows[next]);
    } else if (e.key === 'Enter') {
      const entry = rows.find((r) => r.path === selected);
      if (entry) onOpen(entry);
    } else if (e.key === 'Backspace') {
      if (!atRoot) onOpen(parentEntry(path));
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="flex h-full flex-col overflow-auto outline-none"
      onKeyDown={onKeyDown}
      onMouseDown={() => ref.current?.focus()}
      onContextMenu={onEmptyMenu}
    >
      <div
        className={`sticky top-0 z-10 flex h-[26px] shrink-0 items-center border-b border-white/8 bg-block-flat px-2 ${MIN_ROW_CLASS}`}
      >
        {COLUMNS.map((col) => {
          const active = sort.key === col.key;
          const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown;
          return (
            <button
              key={col.key}
              type="button"
              className={`flex cursor-pointer items-center gap-1 text-[11px] font-medium select-none ${
                col.className
              } ${col.key === 'size' ? 'justify-end' : ''} ${
                active ? 'text-fg-dim' : 'text-fg-faint hover:text-fg-dim'
              }`}
              onClick={() => toggleSort(col.key)}
            >
              {col.label}
              {active && <Arrow size={10} className="shrink-0" />}
            </button>
          );
        })}
      </div>
      {creatingFolder && (
        <div className="flex h-6 shrink-0 items-center gap-2 px-2">
          <FolderPlus size={14} className="shrink-0 text-accent/80" />
          <span className="min-w-0 flex-1">
            <RenameInput initial="" placeholder="folder name" onCommit={onMkdir} onCancel={onMkdirCancel} />
          </span>
        </div>
      )}
      {rows.map((entry) => (
        <FileRow
          key={entry.path}
          entry={entry}
          isParent={entry.name === '..'}
          selected={selected === entry.path}
          renaming={renaming === entry.path}
          onSelect={onSelect}
          onOpen={onOpen}
          onContextMenu={onEntryMenu}
          onRenameCommit={onRenameCommit}
          onRenameCancel={onRenameCancel}
        />
      ))}
      {rows.length === 0 && !creatingFolder && (
        <p className="px-4 py-6 text-center text-xs text-fg-faint select-none">Empty directory</p>
      )}
      {/* fill remaining height so right-click anywhere opens the list menu */}
      <div className="min-h-6 flex-1" onClick={() => onSelect(null)} />
    </div>
  );
}
