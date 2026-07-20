import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const filesRoot = new URL('../src/components/files/', import.meta.url);

test('permission errors offer one-shot sudo access only for local files', async () => {
  const block = await readFile(new URL('FilesBlock.tsx', filesRoot), 'utf8');
  const api = await readFile(new URL('../src/api/fs.ts', import.meta.url), 'utf8');

  assert.match(block, /target === 'local' && errorStatus === 403/);
  assert.match(block, />Try as sudo</);
  assert.match(block, /<SudoPasswordModal/);
  assert.match(api, /export function fsListSudo/);
});

test('sudo password modal clears the password before submitting it', async () => {
  const modal = await readFile(new URL('SudoPasswordModal.tsx', filesRoot), 'utf8');

  assert.match(modal, /const attempt = password/);
  assert.match(modal, /setPassword\(''\)/);
  assert.match(modal, /await onSubmit\(attempt\)/);
});
