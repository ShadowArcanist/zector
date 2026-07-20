import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('terminal uses an intermediate normal font weight', async () => {
  const themes = await readFile(
    new URL('../src/components/terminal/themes.ts', import.meta.url),
    'utf8',
  );
  assert.match(themes, /TERM_FONT_WEIGHT = 550/);
});

test('terminal uses a narrow scrollbar', async () => {
  const [sessions, themes] = await Promise.all([
    readFile(new URL('../src/components/terminal/termSessions.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/terminal/themes.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(sessions, /overviewRuler:\s*\{\s*width:\s*6\s*\}/);
  assert.match(themes, /overviewRulerBorder:\s*'#00000000'/);
});

test('terminal scrollbar appears only while scrolling or directly hovered', async () => {
  const [sessions, css] = await Promise.all([
    readFile(new URL('../src/components/terminal/termSessions.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8'),
  ]);

  assert.match(sessions, /term\.onScroll/);
  assert.match(sessions, /classList\.add\('xterm-scrolling'\)/);
  assert.match(sessions, /classList\.remove\('xterm-scrolling'\)/);
  assert.match(css, /\.scrollbar\.vertical\.visible/);
  assert.match(css, /\.xterm\.xterm-scrolling/);
});

test('mouse-focused block separators do not stay highlighted after resizing', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

  assert.doesNotMatch(css, /\[data-separator='focus'\]\s*\{/);
  assert.match(css, /\[data-separator='focus'\]:focus-visible/);
});
