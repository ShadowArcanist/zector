import { RestartIcon } from '../ui/icons/general';
import { CopyIcon } from '../ui/icons/files';
import { ClipboardIcon, EraserIcon } from '../ui/icons/terminal';
import type { Terminal } from '@xterm/xterm';
import type { TerminalBlockData } from '../../api/types';
import type { MenuEntry } from '../../store/contextMenu';
import { setTermFontSize } from '../../store/blocks';
import { pushToast } from '../../store/toast';
import { DEFAULT_TERM_FONT_SIZE } from './themes';

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 17, 18];

type Opts = {
  leafId: string;
  block: TerminalBlockData;
  term: Terminal | null;
  restart: () => void;
};

/** Right-click menu for the terminal content area. */
export function buildTermMenu({ leafId, block, term, restart }: Opts): MenuEntry[] {
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
      icon: <CopyIcon size={14} />,
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
      icon: <ClipboardIcon size={14} />,
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
    { label: 'Font Size', submenu: sizes },
    'separator',
    { label: 'Clear', icon: <EraserIcon size={14} />, onClick: () => term?.clear() },
    { label: 'Restart Session', icon: <RestartIcon size={14} />, onClick: restart },
  ];
}
