import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('file and folder deletion uses the app confirmation modal', async () => {
  const block = await readFile(
    new URL('../src/components/files/FilesBlock.tsx', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(block, /window\.confirm/);
  assert.match(block, /<ConfirmModal/);
  assert.match(block, /pendingDelete/);
  assert.match(block, /confirmLabel="Delete"/);
  assert.match(block, /void remove\(entry\.path\)/);
});
