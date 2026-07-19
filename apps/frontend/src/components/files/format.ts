export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = '';
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${unit}`;
}

/** Relative for recent, else yyyy-mm-dd. `modified` is unix seconds. */
export function formatModified(modified: number | null): string {
  if (modified === null) return '—';
  const then = modified * 1000;
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  const d = new Date(then);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const IMAGE_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif',
]);

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm',
  'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'env', 'sh', 'bash', 'zsh', 'fish',
  'py', 'rb', 'rs', 'go', 'c', 'h', 'cpp', 'hpp', 'cc', 'java', 'kt', 'swift', 'php',
  'sql', 'log', 'csv', 'tsv', 'lock', 'gitignore', 'dockerfile', 'service', 'lua', 'vim',
  'properties', 'gradle', 'tf', 'nix',
]);

export function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : name.toLowerCase();
}

export const isImageFile = (name: string) => IMAGE_EXTS.has(extOf(name));

export const isTextFile = (name: string, size: number) =>
  size < 1024 * 1024 && TEXT_EXTS.has(extOf(name));

export function joinPath(dir: string, name: string): string {
  return dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`;
}

export function parentPath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  const idx = trimmed.lastIndexOf('/');
  if (idx <= 0) return '/';
  return trimmed.slice(0, idx);
}

/** ['/', '/home', '/home/user'] style breadcrumb segments with labels. */
export function breadcrumbs(path: string): { label: string; path: string }[] {
  const crumbs: { label: string; path: string }[] = [{ label: '/', path: '/' }];
  let acc = '';
  for (const part of path.split('/').filter(Boolean)) {
    acc += `/${part}`;
    crumbs.push({ label: part, path: acc });
  }
  return crumbs;
}
