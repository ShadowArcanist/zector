import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('development server never silently changes ports', async () => {
  const config = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

  assert.match(config, /port:\s*5173/);
  assert.match(config, /strictPort:\s*true/);
});
