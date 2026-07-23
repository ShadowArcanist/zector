import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('toasts have an animated lifecycle, progress, and accessible live regions', async () => {
  const [store, view, css] = await Promise.all([
    source('store/toast.ts'),
    source('components/ui/Toasts.tsx'),
    source('styles/global.css'),
  ]);

  assert.match(store, /leaving: boolean/);
  assert.match(store, /TOAST_EXIT_DURATION/);
  assert.match(view, /toast-enter/);
  assert.match(view, /toast-exit/);
  assert.match(view, /toast-timer/);
  assert.match(view, /role=\{t\.kind === 'error' \? 'alert' : 'status'\}/);
  assert.match(css, /@keyframes toast-in/);
  assert.match(css, /@keyframes toast-out/);
  assert.match(css, /@keyframes toast-timer/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('shared dialogs and popovers use restrained motion classes', async () => {
  const [modal, contextMenu, select, colorSelect, iconSelect, connectionDropdown, pathControl] =
    await Promise.all([
      source('components/ui/Modal.tsx'),
      source('components/ui/ContextMenu.tsx'),
      source('components/ui/Select.tsx'),
      source('components/connections/ColorSelect.tsx'),
      source('components/connections/IconSelect.tsx'),
      source('components/connections/ConnectionDropdown.tsx'),
      source('components/files/FilePathControl.tsx'),
    ]);

  assert.match(modal, /motion-backdrop/);
  assert.match(modal, /motion-dialog/);
  for (const popover of [
    contextMenu,
    select,
    colorSelect,
    iconSelect,
    connectionDropdown,
    pathControl,
  ]) {
    assert.match(popover, /motion-popover/);
  }
});
