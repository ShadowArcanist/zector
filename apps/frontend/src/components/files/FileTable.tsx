import { useRef, useState } from 'react';
import { FileIcon, FolderPlusIcon } from '../ui/icons/files';
import type { FsEntry } from '../../api/types';
import { useFilesNavStore } from '../../store/filesNav';
import { useLayoutStore } from '../../store/layout';
import {
  compareEntries,
  DEFAULT_COL_WIDTHS,
  DEFAULT_SORT,
  type ColWidths,
  type FixedColKey,
  type SortState,
} from './columns';
import { parentPath } from './format';
import { FileRow, RenameInput } from './FileRow';
import { FileTableHeader } from './FileTableHeader';

type Props = {
  leafId: string;
  path: string;
  entries: FsEntry[];
  selected: string | null; // entry path
  renaming: string | null; // entry path being renamed inline
  creatingFile: boolean;
  creatingFolder: boolean;
  onSelect: (entry: FsEntry | null) => void;
  onOpen: (entry: FsEntry) => void;
  onEntryMenu: (entry: FsEntry, e: React.MouseEvent) => void;
  onEmptyMenu: (e: React.MouseEvent) => void;
  onRenameCommit: (entry: FsEntry, newName: string) => void;
  onRenameCancel: () => void;
  onCreateFile: (name: string) => void;
  onCreateFileCancel: () => void;
  onMkdir: (name: string) => void;
  onMkdirCancel: () => void;
};

function parentEntry(path: string): FsEntry {
  return { name: '..', path: parentPath(path), is_dir: true, is_symlink: false, size: 0, modified: null };
}

/** Wave-style directory table: sticky sortable headers, ".." row, keyboard nav. */
export function FileTable({
  leafId,
  path,
  entries,
  selected,
  renaming,
  creatingFile,
  creatingFolder,
  onSelect,
  onOpen,
  onEntryMenu,
  onEmptyMenu,
  onRenameCommit,
  onRenameCancel,
  onCreateFile,
  onCreateFileCancel,
  onMkdir,
  onMkdirCancel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const widthOverrides = useFilesNavStore((s) => s.colWidths[leafId]);
  const widths: ColWidths = { ...DEFAULT_COL_WIDTHS, ...widthOverrides };
  const hiddenList = useLayoutStore((s) => s.hiddenFileColumns);
  const hidden = new Set<FixedColKey>((hiddenList ?? []) as FixedColKey[]);

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
      <FileTableHeader
        leafId={leafId}
        widths={widths}
        hidden={hidden}
        sort={sort}
        onToggleSort={toggleSort}
      />
      {creatingFile && (
        <div className="flex h-6 shrink-0 items-center gap-2 px-2">
          <FileIcon size={14} className="shrink-0 text-accent/80" />
          <span className="min-w-0 flex-1">
            <RenameInput
              initial=""
              placeholder="file name"
              onCommit={onCreateFile}
              onCancel={onCreateFileCancel}
            />
          </span>
        </div>
      )}
      {creatingFolder && (
        <div className="flex h-6 shrink-0 items-center gap-2 px-2">
          <FolderPlusIcon size={14} className="shrink-0 text-accent/80" />
          <span className="min-w-0 flex-1">
            <RenameInput initial="" placeholder="folder name" onCommit={onMkdir} onCancel={onMkdirCancel} />
          </span>
        </div>
      )}
      {rows.map((entry) => (
        <FileRow
          key={entry.path}
          entry={entry}
          widths={widths}
          hidden={hidden}
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
      {rows.length === 0 && !creatingFile && !creatingFolder && (
        <p className="px-4 py-6 text-center text-xs text-fg-faint select-none">Empty directory</p>
      )}
      {/* fill remaining height so right-click anywhere opens the list menu */}
      <div className="min-h-6 flex-1" onClick={() => onSelect(null)} />
    </div>
  );
}
