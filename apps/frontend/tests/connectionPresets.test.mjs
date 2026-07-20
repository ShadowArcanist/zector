import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/components/', import.meta.url);

test('connection picker exposes fifteen icons and twelve colors', async () => {
  const [icons, colors] = await Promise.all([
    readFile(new URL('connections/icons.ts', root), 'utf8'),
    readFile(new URL('connections/colors.ts', root), 'utf8'),
  ]);
  assert.equal((icons.match(/\{ key: '/g) ?? []).length, 15);
  assert.equal((colors.match(/\{ value:/g) ?? []).length, 12);
});
