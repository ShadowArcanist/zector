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

/** Extensions that are definitely binary — everything else opens as editable text. */
// prettier-ignore
const BINARY_EXTS = new Set([
  ...IMAGE_EXTS, 'heic', 'heif', 'tiff', 'psd', 'icns',
  'zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst', '7z', 'rar', 'jar', 'war',
  'pdf', 'exe', 'dll', 'so', 'dylib', 'bin', 'o', 'a', 'class', 'wasm', 'pyc',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp3', 'mp4', 'm4a', 'mov', 'avi', 'mkv', 'webm', 'wav', 'flac', 'ogg',
  'db', 'sqlite', 'sqlite3', 'ds_store',
]);

export function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : name.toLowerCase();
}

export const isImageFile = (name: string) => IMAGE_EXTS.has(extOf(name));

/**
 * Name should open as editable text (Type column + open-as-editor): everything
 * that is not a known binary extension. Unknown or extensionless names
 * (Dockerfile.dev, Makefile, .env, compose.override, …) count as text so they
 * open in the editor instead of downloading; the viewer still catches a binary
 * that carries an unfamiliar extension by sniffing its content.
 */
export const isTextName = (name: string): boolean => {
  const lower = name.toLowerCase();
  const ext = extOf(lower.startsWith('.') ? lower.slice(1) : lower);
  return !BINARY_EXTS.has(ext);
};

/** Max file size the viewer will fetch as text; larger files show "File too large." */
export const MAX_TEXT_VIEW_SIZE = 1024 * 1024;

export const isTextFile = (name: string, size: number) =>
  size < MAX_TEXT_VIEW_SIZE && isTextName(name);

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
