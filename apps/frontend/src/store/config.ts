import { create } from 'zustand';
import type { ITheme } from '@xterm/xterm';
import {
  DEFAULT_SETTINGS,
  getConfig,
  parseConfig,
  type AppConfig,
  type ConfigSettings,
  type TermThemeDef,
} from '../api/config';
import { TERM_THEME } from '../components/terminal/themes';

/** Built-in graphite terminal theme — always first in the registry. */
const BUILT_IN_THEME: TermThemeDef = { key: 'default', name: 'Graphite', order: -1, theme: TERM_THEME };

type ConfigStore = AppConfig & { load: () => Promise<void> };

/** Block appearance is global — push it onto :root as CSS variables. */
function applyBlockVars(s: ConfigSettings) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(s.blockBg);
  const bg = m
    ? `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${s.blockOpacity})`
    : s.blockBg; // non-hex CSS color: use as-is, opacity does not apply
  const root = document.documentElement.style;
  root.setProperty('--color-block', bg);
  root.setProperty('--block-blur', s.blockBlur ? 'blur(10px)' : 'none');
}

export const useConfigStore = create<ConfigStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  backgrounds: [],
  termThemes: [BUILT_IN_THEME],

  load: async () => {
    let cfg: AppConfig = { settings: DEFAULT_SETTINGS, backgrounds: [], termThemes: [] };
    try {
      cfg = parseConfig(await getConfig());
    } catch {
      // backend unreachable — keep the built-in defaults
    }
    applyBlockVars(cfg.settings);
    set({ ...cfg, termThemes: [BUILT_IN_THEME, ...cfg.termThemes] });
  },
}));

let loadPromise: Promise<void> | null = null;

/**
 * Start (or join) the one boot-time config load. Runs in parallel with layout
 * init; layout awaits it so tab.bg validation and the default tab preset see
 * the loaded registry. Never rejects — failures fall back to defaults.
 */
export function loadConfig(): Promise<void> {
  loadPromise ??= useConfigStore.getState().load();
  return loadPromise;
}

/** Registry theme for a key; unknown/unset falls back to the built-in default. */
export function resolveTermTheme(themes: TermThemeDef[], key: string): ITheme {
  return themes.find((t) => t.key === key)?.theme ?? TERM_THEME;
}
