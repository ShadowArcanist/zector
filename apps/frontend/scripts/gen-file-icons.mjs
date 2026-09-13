// Regenerates src/components/files/material-icons.gen.json from the full
// material-icon-theme manifest, keeping only the keys fileIcons.ts reads.
// This drops ~160 KB of unused data (folderNamesExpanded, light/highContrast
// variants, ...). Rerun after bumping material-icon-theme: `bun run gen:icons`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(
  new URL('../node_modules/material-icon-theme/dist/material-icons.json', import.meta.url),
);
const OUT = fileURLToPath(new URL('../src/components/files/material-icons.gen.json', import.meta.url));
const KEEP = ['iconDefinitions', 'fileExtensions', 'fileNames', 'folderNames', 'languageIds', 'file', 'folder'];

const full = JSON.parse(readFileSync(SRC, 'utf8'));
const trimmed = Object.fromEntries(KEEP.filter((k) => k in full).map((k) => [k, full[k]]));
writeFileSync(OUT, JSON.stringify(trimmed) + '\n');
console.log(`wrote ${OUT} (${KEEP.length} keys)`);
