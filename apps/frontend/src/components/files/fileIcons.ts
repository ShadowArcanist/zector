import J from 'material-icon-theme/dist/material-icons.json';

/**
 * Material-icon-theme lookup for file/folder icons, adapted from the user's
 * gitbase app (reference/gitbase). SVGs are emitted as separate assets
 * (assetsInlineLimit 0) so the browser only fetches the icons it shows.
 */

const defs = J.iconDefinitions as Record<string, { iconPath: string }>;
const fileExtensions = J.fileExtensions as Record<string, string>;
const fileNames = J.fileNames as Record<string, string>;
const folderNames = J.folderNames as Record<string, string>;
const languageIds = J.languageIds as Record<string, string>;

const iconUrls = import.meta.glob<string>(
  '../../../node_modules/material-icon-theme/icons/*.svg',
  { query: '?url', import: 'default', eager: true },
);

const urlByName: Record<string, string> = {};
for (const [path, url] of Object.entries(iconUrls)) {
  const m = path.match(/\/([^/]+)\.svg$/);
  if (m) urlByName[m[1]] = url;
}

function urlFor(key: string | undefined): string | undefined {
  if (!key) return undefined;
  const m = defs[key]?.iconPath.match(/\/([^/]+)\.svg$/);
  return m ? urlByName[m[1]] : undefined;
}

// prettier-ignore
const extOverrides: Record<string, string> = {
  ts: 'typescript', mts: 'typescript', cts: 'typescript',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  html: 'html', htm: 'html', yml: 'yaml', yaml: 'yaml',
  sh: 'console', bash: 'console', zsh: 'console', fish: 'console',
  ps1: 'powershell', bat: 'console', cmd: 'console',
  txt: 'text', log: 'log', xml: 'xml', svg: 'svg', csv: 'table', tsv: 'table',
  pdf: 'pdf', zip: 'zip', tar: 'zip', gz: 'zip', '7z': 'zip', rar: 'zip',
  mp3: 'audio', wav: 'audio', flac: 'audio', ogg: 'audio',
  mp4: 'video', mov: 'video', mkv: 'video', webm: 'video', avi: 'video',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  bmp: 'image', ico: 'image', tiff: 'image', avif: 'image', psd: 'image',
  otf: 'font', ttf: 'font', woff: 'font', woff2: 'font', eot: 'font',
  lock: 'lock', pem: 'key', key: 'key', crt: 'certificate', cert: 'certificate', cer: 'certificate',
};

function lookupExtension(name: string): string | undefined {
  const parts = name.toLowerCase().split('.');
  if (parts.length < 2) return undefined;
  for (let i = 1; i < parts.length; i++) {
    const ext = parts.slice(i).join('.');
    if (fileExtensions[ext]) return fileExtensions[ext];
  }
  const single = parts[parts.length - 1];
  return extOverrides[single] ?? languageIds[single];
}

export function fileIconUrl(name: string, isDir: boolean): string {
  const lower = name.toLowerCase();
  if (isDir) return urlFor(folderNames[lower]) ?? urlFor(J.folder) ?? '';
  const byName = urlFor(fileNames[lower]);
  if (byName) return byName;
  const byExt = urlFor(lookupExtension(name));
  return byExt ?? urlFor(J.file) ?? '';
}
