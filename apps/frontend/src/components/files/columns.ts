import type { FsEntry } from '../../api/types';
import { extOf, isImageFile, isTextName } from './format';

export type SortKey = 'name' | 'perm' | 'modified' | 'size' | 'type';
export type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export const DEFAULT_SORT: SortState = { key: 'name', dir: 'asc' };

/** Shared column sizing so header and rows line up. Name flexes; rest fixed. */
export const COL = {
  name: 'min-w-0 flex-1',
  perm: 'w-[76px] shrink-0',
  modified: 'w-[96px] shrink-0',
  size: 'w-[56px] shrink-0 text-right',
  type: 'w-[68px] shrink-0 pl-3',
} as const;

/** Rows keep at least this width; narrow blocks scroll horizontally (Wave-style). */
export const MIN_ROW_CLASS = 'min-w-[440px]';

export const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'name', label: 'Name', className: COL.name },
  { key: 'perm', label: 'Perm', className: COL.perm },
  { key: 'modified', label: 'Last Modified', className: COL.modified },
  { key: 'size', label: 'Size', className: COL.size },
  { key: 'type', label: 'Type', className: COL.type },
];

/** 0o100644 → "-rw-r--r--"; null/undefined mode → "-". */
export function permString(entry: FsEntry): string {
  const { mode } = entry;
  if (mode === null || mode === undefined) return '-';
  let out = entry.is_symlink ? 'l' : entry.is_dir ? 'd' : '-';
  for (let shift = 6; shift >= 0; shift -= 3) {
    const bits = (mode >> shift) & 7;
    out += (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + (bits & 1 ? 'x' : '-');
  }
  return out;
}

const ARCHIVE_EXTS = new Set(['zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', '7z', 'rar', 'zst', 'jar']);

export function typeLabel(entry: FsEntry): string {
  if (entry.is_dir) return 'directory';
  if (isImageFile(entry.name)) return 'image';
  if (ARCHIVE_EXTS.has(extOf(entry.name))) return 'archive';
  if (isTextName(entry.name)) return 'text/plain';
  return '';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Wave-style: "Jun 13 08:54" this year, else "2024-05-28". */
export function formatModified(modified: number | null): string {
  if (modified === null) return '';
  const d = new Date(modified * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d.getFullYear() === new Date().getFullYear()) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Directories always sort before files; ties fall back to name asc. */
export function compareEntries(a: FsEntry, b: FsEntry, sort: SortState): number {
  if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  let cmp = 0;
  switch (sort.key) {
    case 'name':
      cmp = byName;
      break;
    case 'perm':
      cmp = permString(a).localeCompare(permString(b));
      break;
    case 'modified':
      cmp = (a.modified ?? 0) - (b.modified ?? 0);
      break;
    case 'size':
      cmp = a.size - b.size;
      break;
    case 'type':
      cmp = typeLabel(a).localeCompare(typeLabel(b));
      break;
  }
  return (cmp || byName) * (sort.dir === 'asc' ? 1 : -1);
}
