import type { ITheme } from '@xterm/xterm';

/** Fixed terminal look: neutral graphite. Tab backgrounds are the only visual customization. */

export const DEFAULT_TERM_FONT_SIZE = 13;
export const TERM_FONT_WEIGHT = 500;
export const TERM_FONT_WEIGHT_BOLD = 700;

// prettier-ignore
export const TERM_THEME: ITheme = {
  black: '#757575', red: '#cc685c', green: '#76c266', yellow: '#cbca9b',
  blue: '#85aacb', magenta: '#cc72ca', cyan: '#74a7cb', white: '#c1c1c1',
  brightBlack: '#727272', brightRed: '#cc9d97', brightGreen: '#a3dd97', brightYellow: '#cbcaaa',
  brightBlue: '#9ab6cb', brightMagenta: '#cc8ecb', brightCyan: '#b7b8cb', brightWhite: '#f0f0f0',
  foreground: '#d4d4d4', background: '#141414', cursor: '#d4d4d4', selectionBackground: '#3d4043',
};

export const TERM_FONT =
  "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', Consolas, 'Liberation Mono', monospace";

/** Transparent terminals (tab bg presets) drop the opaque background color. */
export const themedTheme = (t: ITheme, transparent: boolean): ITheme =>
  transparent ? { ...t, background: '#00000000' } : t;
