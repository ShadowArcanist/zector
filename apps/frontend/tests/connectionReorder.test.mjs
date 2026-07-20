import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  insertLocalConnection,
  moveConnectionId,
} from '../src/components/connections/reorder.ts';

test('connection ids can move before or after another connection', () => {
  const ids = ['one', 'two', 'three'];

  assert.deepEqual(moveConnectionId(ids, 'one', 'three', true), ['two', 'three', 'one']);
  assert.deepEqual(moveConnectionId(ids, 'three', 'one', false), ['three', 'one', 'two']);
  assert.deepEqual(moveConnectionId(ids, 'two', 'two', true), ids);
});

test('localhost can be inserted and moved among SSH connections', () => {
  const order = insertLocalConnection(['one', 'two', 'three'], 2);

  assert.deepEqual(order, ['one', 'two', 'local', 'three']);
  assert.deepEqual(moveConnectionId(order, 'local', 'one', false), [
    'local',
    'one',
    'two',
    'three',
  ]);
});

test('block header connection name uses medium weight', async () => {
  const source = await readFile(
    new URL('../src/components/connections/ConnectionButton.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /className="truncate font-medium"/);
});

test('connections modal supports dragging every connection into a persisted order', async () => {
  const [source, layout, uiState] = await Promise.all([
    readFile(new URL('../src/components/connections/ConnectionsModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/store/layout.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/store/uiState.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(source, /draggable=/);
  assert.match(source, /moveConnectionId/);
  assert.match(source, /reorderConnections/);
  assert.match(source, /insertLocalConnection/);
  assert.match(source, /setLocalConnectionIndex/);
  assert.match(layout, /setLocalConnectionIndex/);
  assert.match(uiState, /localConnectionIndex/);
});

test('block connection switcher follows the saved localhost position', async () => {
  const source = await readFile(
    new URL('../src/components/connections/ConnectionDropdown.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /localConnectionIndex/);
  assert.match(source, /insertLocalConnection/);
});
