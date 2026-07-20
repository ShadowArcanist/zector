import type { FsEntry } from '../../api/types';
import { extOf, isImageFile, isTextName } from './format';

export type SortKey = 'name' | 'perm' | 'modified' | 'size' | 'type';
export type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export const DEFAULT_SORT: SortState = { key: 'name', dir: 'asc' };

/**
 * Column sizing shared by header and rows so they line up. Name flexes into
 * the remaining space; the rest have pixel widths (user-resizable per block,
 * kept in the filesNav store keyed by leafId).
 */
export const DEFAULT_COL_WIDTHS = { perm: 76, modified: 96, size: 56, type: 68 } as const;
export type FixedColKey = keyof typeof DEFAULT_COL_WIDTHS;
export type ColWidths = Record<FixedColKey, number>;
export const MIN_COL_WIDTH = 50;
export const MAX_COL_WIDTH = 400;
export const NAME_MIN_WIDTH = 120;

export const HIDEABLE_COLS: FixedColKey[] = ['perm', 'modified', 'size', 'type'];

/** Minimum row width: name min + horizontal padding + the visible fixed columns. */
export function rowMinWidth(widths: ColWidths, hidden: ReadonlySet<FixedColKey>): number {
  return (
    NAME_MIN_WIDTH +
    16 +
    HIDEABLE_COLS.reduce((sum, key) => sum + (hidden.has(key) ? 0 : widths[key]), 0)
  );
}

export const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'perm', label: 'Perm' },
  { key: 'modified', label: 'Last Modified' },
  { key: 'size', label: 'Size' },
  { key: 'type', label: 'Type' },
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
