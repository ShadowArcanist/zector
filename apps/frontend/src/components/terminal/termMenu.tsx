import { RestartIcon } from '../ui/icons/general';
import { CopyIcon } from '../ui/icons/files';
import { ClipboardIcon, EraserIcon } from '../ui/icons/terminal';
import type { Terminal } from '@xterm/xterm';
import type { TerminalBlockData } from '../../api/types';
import type { MenuEntry } from '../../store/contextMenu';
import { setTermFontSize, setTermTheme } from '../../store/blocks';
import { useConfigStore } from '../../store/config';
import { pushToast } from '../../store/toast';

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 17, 18];

type Opts = {
  leafId: string;
  block: TerminalBlockData;
  term: Terminal | null;
  restart: () => void;
};

/** Right-click menu for the terminal content area. */
export function buildTermMenu({ leafId, block, term, restart }: Opts): MenuEntry[] {
  const { settings, termThemes } = useConfigStore.getState();
  const sizes: MenuEntry[] = [
    {
      label: `Default (${settings.termFontSize}px)`,
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

  const defaultThemeName =
    termThemes.find((t) => t.key === settings.termTheme)?.name ?? 'Graphite';
  const themes: MenuEntry[] = [
    {
      label: `Default (${defaultThemeName})`,
      checked: block.termTheme === undefined,
      onClick: () => setTermTheme(leafId, undefined),
    },
    'separator',
    ...termThemes.map(
      (t): MenuEntry => ({
        label: t.name,
        checked: block.termTheme === t.key,
        onClick: () => setTermTheme(leafId, t.key),
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
    { label: 'Themes', submenu: themes },
    'separator',
    { label: 'Clear', icon: <EraserIcon size={14} />, onClick: () => term?.clear() },
    { label: 'Restart Session', icon: <RestartIcon size={14} />, onClick: restart },
  ];
}
