import assert from 'node:assert/strict';
import test from 'node:test';

import { filterCommands, nextCommandIndex } from '../src/components/command/commandPaletteModel.ts';

const commands = [
  { id: 'new-tab', label: 'New tab', keywords: 'create workspace' },
  { id: 'connections', label: 'Open connections', keywords: 'ssh servers' },
  { id: 'files-local', label: 'New local files', keywords: 'browser machine' },
];

test('filters commands by label and keywords', () => {
  assert.deepEqual(filterCommands(commands, 'ssh').map((command) => command.id), ['connections']);
  assert.deepEqual(filterCommands(commands, 'local file').map((command) => command.id), [
    'files-local',
  ]);
});

test('keeps prefix matches ahead of keyword matches', () => {
  const result = filterCommands(commands, 'new');
  assert.deepEqual(result.map((command) => command.id), ['new-tab', 'files-local']);
});

test('keyboard selection wraps around the result list', () => {
  assert.equal(nextCommandIndex(2, 1, 3), 0);
  assert.equal(nextCommandIndex(0, -1, 3), 2);
  assert.equal(nextCommandIndex(0, 1, 0), 0);
});
