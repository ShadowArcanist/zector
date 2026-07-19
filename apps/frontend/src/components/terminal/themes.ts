import type { ITheme } from '@xterm/xterm';

/** Fixed terminal look: Tokyo Night. Tab backgrounds are the only visual customization. */

export const DEFAULT_TERM_FONT_SIZE = 13;
export const TERM_FONT_WEIGHT = 500;
export const TERM_FONT_WEIGHT_BOLD = 700;

// prettier-ignore
export const TERM_THEME: ITheme = {
  black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
  blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
  brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
  brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5',
  foreground: '#c0caf5', background: '#1a1b26', cursor: '#c0caf5', selectionBackground: '#283457',
};

export const TERM_FONT =
  "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', Consolas, 'Liberation Mono', monospace";
