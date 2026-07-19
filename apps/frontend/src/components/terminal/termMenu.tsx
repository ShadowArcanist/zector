import { Clipboard, Copy, Eraser, RotateCw } from 'lucide-react';
import type { Terminal } from '@xterm/xterm';
import type { TerminalBlockData } from '../../api/types';
import type { MenuEntry } from '../../store/contextMenu';
import { setTermFontSize, setTermTheme } from '../../store/blocks';
import { pushToast } from '../../store/toast';
import { DEFAULT_TERM_FONT_SIZE, TERM_THEMES, TERM_THEME_KEYS } from './themes';

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 17, 18];

type Opts = {
  leafId: string;
  block: TerminalBlockData;
  term: Terminal | null;
  restart: () => void;
};

/** Right-click menu for the terminal content area. */
export function buildTermMenu({ leafId, block, term, restart }: Opts): MenuEntry[] {
  const themes: MenuEntry[] = [
    {
      label: 'Default',
      checked: block.termTheme === undefined,
      onClick: () => setTermTheme(leafId, undefined),
    },
    'separator',
    ...TERM_THEME_KEYS.map(
      (key): MenuEntry => ({
        label: TERM_THEMES[key].name,
        checked: block.termTheme === key,
        onClick: () => setTermTheme(leafId, key),
      }),
    ),
  ];

  const sizes: MenuEntry[] = [
    {
      label: `Default (${DEFAULT_TERM_FONT_SIZE}px)`,
      checked: block.fontSize === undefined,
      onClick: () => setTermFontSize(leafId, undefined),
    },
    'separator',
    ...FONT_SIZES.map(
      (n): MenuEntry => ({
        label: `${n}px`,
        checked: block.fontSize === n,
        onClick: () => setTermFontSize(leafId, n),
      }),
    ),
  ];

  return [
    {
      label: 'Copy',
      icon: <Copy size={13} />,
      disabled: !term?.hasSelection(),
      onClick: () => {
        const sel = term?.getSelection();
        if (sel) {
          navigator.clipboard.writeText(sel).catch(() => pushToast('error', 'Could not copy'));
        }
      },
    },
    {
      label: 'Paste',
      icon: <Clipboard size={13} />,
      onClick: () => {
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) term?.paste(text);
          })
          .catch(() => pushToast('error', 'Clipboard unavailable'));
      },
    },
    'separator',
    { label: 'Themes', submenu: themes },
    { label: 'Font Size', submenu: sizes },
    'separator',
    { label: 'Clear', icon: <Eraser size={13} />, onClick: () => term?.clear() },
    { label: 'Restart Session', icon: <RotateCw size={13} />, onClick: restart },
  ];
}
