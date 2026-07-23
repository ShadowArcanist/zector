import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('file explorer exposes an inline New File action', async () => {
  const [block, table, hook, api] = await Promise.all([
    readFile(new URL('../src/components/files/FilesBlock.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/files/FileTable.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/files/useFiles.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/api/fs.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(block, /label: 'New File'/);
  assert.match(block, /setCreatingFile\(true\)/);
  assert.match(table, /placeholder="file name"/);
  assert.match(hook, /fsCreate/);
  assert.match(api, /export function fsCreate/);
  assert.match(api, /\/create/);
});
