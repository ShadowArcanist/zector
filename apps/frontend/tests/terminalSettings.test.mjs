import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('terminal uses a semibold normal font weight', async () => {
  const themes = await readFile(
    new URL('../src/components/terminal/themes.ts', import.meta.url),
    'utf8',
  );
  assert.match(themes, /TERM_FONT_WEIGHT = 600/);
});
