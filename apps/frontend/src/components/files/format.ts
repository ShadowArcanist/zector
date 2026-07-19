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

const IMAGE_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif',
]);

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm',
  'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'env', 'sh', 'bash', 'zsh', 'fish',
  'py', 'rb', 'rs', 'go', 'c', 'h', 'cpp', 'hpp', 'cc', 'java', 'kt', 'swift', 'php',
  'sql', 'log', 'csv', 'tsv', 'lock', 'gitignore', 'dockerfile', 'service', 'lua', 'vim',
  'properties', 'gradle', 'tf', 'nix', 'pub',
]);

export function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : name.toLowerCase();
}

export const isImageFile = (name: string) => IMAGE_EXTS.has(extOf(name));

/** Extension looks like text, regardless of size (used for the Type column). */
export const isTextName = (name: string) => TEXT_EXTS.has(extOf(name));

export const isTextFile = (name: string, size: number) =>
  size < 1024 * 1024 && isTextName(name);

export function joinPath(dir: string, name: string): string {
  return dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`;
}

export function parentPath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  const idx = trimmed.lastIndexOf('/');
  if (idx <= 0) return '/';
  return trimmed.slice(0, idx);
}

/**
 * Header display for a files block path: home-relative with `~`, middle
 * ellipsis when very long ("~/dev/…/deep/dir").
 */
export function displayPath(path: string, home?: string): string {
  if (!path) return 'files';
  let p = path;
  if (home && (p === home || p.startsWith(`${home}/`))) p = `~${p.slice(home.length)}`;
  if (p.length > 44) p = `${p.slice(0, 18)}…${p.slice(-25)}`;
  return p;
}
