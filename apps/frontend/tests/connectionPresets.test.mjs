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
  for (const name of ['Phone 3', 'Star Sparkle', 'Screencast 2', 'Bolt']) {
    assert.match(icons, new RegExp(`name: '${name}'`));
  }
  assert.doesNotMatch(colors, /Indigo|Lime/);
  assert.match(colors, /Brown/);
  assert.match(colors, /White/);
});

test('connection dropdown only renders connection names', async () => {
  const dropdown = await readFile(new URL('connections/ConnectionDropdown.tsx', root), 'utf8');
  assert.doesNotMatch(dropdown, /opt\.sub/);
});

test('deleting an SSH connection uses the app confirmation modal', async () => {
  const form = await readFile(new URL('connections/ConnectionForm.tsx', root), 'utf8');

  assert.match(form, /<ConfirmModal/);
  assert.doesNotMatch(form, /window\.confirm/);
});
