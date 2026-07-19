import { DEFAULT_TERM_THEME } from '../components/terminal/themes';

/**
 * App-shell theme presets. Each overrides the Tailwind @theme color variables
 * at runtime (inline styles on <html> win over the stylesheet defaults).
 * `termTheme` is the terminal preset used when a block has no explicit theme.
 */
export type UiTheme = { name: string; termTheme: string; vars: Record<string, string> };

export const DEFAULT_UI_THEME = 'tokyonight';

// vars order: bg0 bg1 bg2 bg3 block-flat fg fg-dim fg-faint accent accent-dim ok warn danger
function palette(v: string[]): Record<string, string> {
  const keys = [
    '--color-bg0',
    '--color-bg1',
    '--color-bg2',
    '--color-bg3',
    '--color-block-flat',
    '--color-fg',
    '--color-fg-dim',
    '--color-fg-faint',
    '--color-accent',
    '--color-accent-dim',
    '--color-ok',
    '--color-warn',
    '--color-danger',
  ];
  return Object.fromEntries(keys.map((k, i) => [k, v[i]]));
}

// prettier-ignore
export const UI_THEMES: Record<string, UiTheme> = {
  tokyonight: {
    name: 'Tokyo Night', termTheme: 'tokyonight',
    vars: palette(['#1a1b26', '#1f2335', '#24283b', '#292e42', '#101017', '#c0caf5', '#a9b1d6', '#565f89', '#7aa2f7', '#3d59a1', '#9ece6a', '#e0af68', '#f7768e']),
  },
  'default-dark': {
    name: 'Default Dark', termTheme: 'default-dark',
    vars: palette(['#222222', '#232323', '#2a2a2a', '#333333', '#111111', '#f7f7f7', '#c3c8c2', '#8b918a', '#58c142', '#3a7a2e', '#4e9a06', '#e0b956', '#e54d2e']),
  },
  onedarkpro: {
    name: 'One Dark Pro', termTheme: 'onedarkpro',
    vars: palette(['#21252b', '#282c34', '#2f333d', '#3a3f4b', '#14161a', '#abb2bf', '#9198a5', '#5c6370', '#61afef', '#3a6a94', '#98c379', '#d18f52', '#e06c75']),
  },
  dracula: {
    name: 'Dracula', termTheme: 'dracula',
    vars: palette(['#282a36', '#2c2e3b', '#343746', '#3d4051', '#191a21', '#f8f8f2', '#c8c8c2', '#6272a4', '#bd93f9', '#7d62a6', '#50fa7b', '#f1fa8c', '#ff5555']),
  },
  monokai: {
    name: 'Monokai', termTheme: 'monokai',
    vars: palette(['#272822', '#2d2e27', '#34352e', '#3e3f38', '#191a15', '#f8f8f2', '#c8c8c2', '#75715e', '#a6e22e', '#6e961e', '#a6e22e', '#e6db74', '#f92672']),
  },
  campbell: {
    name: 'Campbell', termTheme: 'campbell',
    vars: palette(['#0c0c0c', '#161616', '#1e1e1e', '#2a2a2a', '#060606', '#cccccc', '#a8a8a8', '#767676', '#3a96dd', '#26639a', '#16c60c', '#c19c00', '#e74856']),
  },
  warmyellow: {
    name: 'Warm Yellow', termTheme: 'warmyellow',
    vars: palette(['#2b2620', '#322c25', '#3a332b', '#453d33', '#1b1712', '#f2e6d4', '#cfc4b2', '#7e705a', '#f9d784', '#a68f52', '#82e0aa', '#f4d03f', '#e74c3c']),
  },
  rosepine: {
    name: 'Rose Pine', termTheme: 'rosepine',
    vars: palette(['#191724', '#1f1d2e', '#26233a', '#2f2b45', '#100e18', '#e0def4', '#b7b3d3', '#908caa', '#c4a7e7', '#8271a3', '#9ccfb0', '#f6c177', '#eb6f92']),
  },
};

export function applyUiTheme(key: string | undefined) {
  const theme = UI_THEMES[key ?? ''] ?? UI_THEMES[DEFAULT_UI_THEME];
  const style = document.documentElement.style;
  for (const [k, v] of Object.entries(theme.vars)) style.setProperty(k, v);
}

/** Terminal theme to use when a block has no explicit override. */
export function defaultTermThemeFor(uiThemeKey: string | undefined): string {
  return UI_THEMES[uiThemeKey ?? '']?.termTheme ?? DEFAULT_TERM_THEME;
}
