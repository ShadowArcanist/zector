import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { moveConnectionId } from '../src/components/connections/reorder.ts';

test('connection ids can move before or after another connection', () => {
  const ids = ['one', 'two', 'three'];

  assert.deepEqual(moveConnectionId(ids, 'one', 'three', true), ['two', 'three', 'one']);
  assert.deepEqual(moveConnectionId(ids, 'three', 'one', false), ['three', 'one', 'two']);
  assert.deepEqual(moveConnectionId(ids, 'two', 'two', true), ids);
});

test('block header connection name uses medium weight', async () => {
  const source = await readFile(
    new URL('../src/components/connections/ConnectionButton.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /className="truncate font-medium"/);
});

test('connections modal supports dragging SSH connections into a persisted order', async () => {
  const source = await readFile(
    new URL('../src/components/connections/ConnectionsModal.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /draggable=/);
  assert.match(source, /moveConnectionId/);
  assert.match(source, /reorderConnections/);
});
