import type { ITheme } from '@xterm/xterm';

/** Wave Terminal's built-in theme presets (termthemes.json), Tokyo Night default. */
export type TermTheme = { name: string; theme: ITheme };

export const DEFAULT_TERM_THEME = 'tokyonight';
export const DEFAULT_TERM_FONT_SIZE = 12;

// prettier-ignore
export const TERM_THEMES: Record<string, TermTheme> = {
  tokyonight: {
    name: 'Tokyo Night',
    theme: {
      black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
      blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
      brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
      brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5',
      foreground: '#c0caf5', background: '#1a1b26', cursor: '#c0caf5', selectionBackground: '#283457',
    },
  },
  'default-dark': {
    name: 'Default Dark',
    theme: {
      black: '#757575', red: '#cc685c', green: '#76c266', yellow: '#cbca9b',
      blue: '#85aacb', magenta: '#cc72ca', cyan: '#74a7cb', white: '#c1c1c1',
      brightBlack: '#727272', brightRed: '#cc9d97', brightGreen: '#a3dd97', brightYellow: '#cbcaaa',
      brightBlue: '#9ab6cb', brightMagenta: '#cc8ecb', brightCyan: '#b7b8cb', brightWhite: '#f0f0f0',
      foreground: '#c1c1c1', background: '#000000',
    },
  },
  onedarkpro: {
    name: 'One Dark Pro',
    theme: {
      black: '#3F4451', red: '#E06C75', green: '#98C379', yellow: '#D18F52',
      blue: '#61AFEF', magenta: '#C678DD', cyan: '#42B3C2', white: '#D7DAE0',
      brightBlack: '#4F5666', brightRed: '#FF616E', brightGreen: '#A5E075', brightYellow: '#F0A45D',
      brightBlue: '#4DC4FF', brightMagenta: '#DE73FF', brightCyan: '#4CD1E0', brightWhite: '#E6E6E6',
      foreground: '#ABB2BF', background: '#21252B', cursor: '#D7DAE0',
    },
  },
  dracula: {
    name: 'Dracula',
    theme: {
      black: '#21222C', red: '#FF5555', green: '#50FA7B', yellow: '#F1FA8C',
      blue: '#BD93F9', magenta: '#FF79C6', cyan: '#8BE9FD', white: '#F8F8F2',
      brightBlack: '#6272A4', brightRed: '#FF6E6E', brightGreen: '#69FF94', brightYellow: '#FFFFA5',
      brightBlue: '#D6ACFF', brightMagenta: '#FF92DF', brightCyan: '#A4FFFF', brightWhite: '#FFFFFF',
      foreground: '#F8F8F2', background: '#282a36', cursor: '#f8f8f2',
    },
  },
  monokai: {
    name: 'Monokai',
    theme: {
      black: '#1B1D1E', red: '#F92672', green: '#A6E22E', yellow: '#E6DB74',
      blue: '#66D9EF', magenta: '#AE81FF', cyan: '#A1EFE4', white: '#F8F8F2',
      brightBlack: '#75715E', brightRed: '#FD5FF1', brightGreen: '#A6E22E', brightYellow: '#E6DB74',
      brightBlue: '#66D9EF', brightMagenta: '#AE81FF', brightCyan: '#A1EFE4', brightWhite: '#F9F8F5',
      foreground: '#F8F8F2', background: '#272822', cursor: '#F8F8F2',
    },
  },
  campbell: {
    name: 'Campbell',
    theme: {
      black: '#0C0C0C', red: '#C50F1F', green: '#13A10E', yellow: '#C19C00',
      blue: '#0037DA', magenta: '#881798', cyan: '#3A96DD', white: '#CCCCCC',
      brightBlack: '#767676', brightRed: '#E74856', brightGreen: '#16C60C', brightYellow: '#F9F1A5',
      brightBlue: '#3B78FF', brightMagenta: '#B4009E', brightCyan: '#61D6D6', brightWhite: '#F2F2F2',
      foreground: '#CCCCCC', background: '#0C0C0C', cursor: '#CCCCCC', selectionBackground: '#3A96DD77',
    },
  },
  warmyellow: {
    name: 'Warm Yellow',
    theme: {
      black: '#3C3228', red: '#E67E22', green: '#A5D6A7', yellow: '#F9D784',
      blue: '#7FB3D5', magenta: '#C39BD3', cyan: '#5DADE2', white: '#ECF0F1',
      brightBlack: '#7E705A', brightRed: '#E74C3C', brightGreen: '#82E0AA', brightYellow: '#F4D03F',
      brightBlue: '#3498DB', brightMagenta: '#9B59B6', brightCyan: '#1ABC9C', brightWhite: '#FFFFFF',
      foreground: '#F2E6D4', background: '#2B2620', cursor: '#F9D784', selectionBackground: '#B7950B77',
    },
  },
  rosepine: {
    name: 'Rose Pine',
    theme: {
      black: '#26233a', red: '#eb6f92', green: '#3e8fb0', yellow: '#f6c177',
      blue: '#9ccfd8', magenta: '#c4a7e7', cyan: '#ebbcba', white: '#e0def4',
      brightBlack: '#908caa', brightRed: '#ff8cab', brightGreen: '#9ccfb0', brightYellow: '#ffd196',
      brightBlue: '#bee6e0', brightMagenta: '#e2c4ff', brightCyan: '#ffd1d0', brightWhite: '#fffaf3',
      foreground: '#e0def4', background: '#191724', cursor: '#524f67',
    },
  },
};

/** Ordered keys for the theme submenu (default first). */
export const TERM_THEME_KEYS = [
  'tokyonight',
  'default-dark',
  'onedarkpro',
  'dracula',
  'monokai',
  'campbell',
  'warmyellow',
  'rosepine',
];

export function resolveTermTheme(key: string | undefined): TermTheme {
  return TERM_THEMES[key ?? DEFAULT_TERM_THEME] ?? TERM_THEMES[DEFAULT_TERM_THEME];
}

export const TERM_FONT =
  "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', Consolas, 'Liberation Mono', monospace";
