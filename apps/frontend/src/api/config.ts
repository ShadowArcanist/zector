import type { ITheme } from '@xterm/xterm';
import { apiGet } from './http';

/**
 * `GET /api/config` — user-editable JSON files in ~/.config/zector, parsed
 * fresh by the backend on every request. Wave-format keys ("display:name",
 * "bg@…") are normalized here into clean frontend shapes.
 */

export type ConfigSettings = {
  tabPreset: string | null; // default tab background key (normalized, no "bg@")
  termFontSize: number; // default terminal font size (per-block fontSize overrides)
  termTheme: string; // default terminal theme key (per-block termTheme overrides)
  blockBg: string; // block background color (hex, or any CSS color passed through)
  blockBlur: boolean; // backdrop blur behind every block
  blockOpacity: number; // opacity applied to blockBg (hex only)
  blockHighlight: boolean; // draw a border around the focused block
};

export type BackgroundDef = {
  key: string;
  name: string;
  order: number;
  bg: string;
  opacity: number;
  accent?: string; // drives --color-accent (draggers, selections…) while active
  highlightActive?: boolean; // per-theme focus highlight toggle (default true)
  highlightColor?: string; // focused-block border color (falls back to accent)
  highlightWidth?: number; // focused-block border width in px (default 2)
};
export type TermThemeDef = { key: string; name: string; order: number; theme: ITheme };

export type AppConfig = {
  settings: ConfigSettings;
  backgrounds: BackgroundDef[];
  termThemes: TermThemeDef[];
};

/** Matches the backend's seeded settings.json — used when /api/config fails. */
export const DEFAULT_SETTINGS: ConfigSettings = {
  tabPreset: null,
  termFontSize: 13,
  termTheme: 'default',
  blockBg: '#000000',
  blockBlur: false,
  blockOpacity: 0.25,
  blockHighlight: true,
};

export function getConfig(): Promise<unknown> {
  return apiGet('/api/config');
}

/** Saved tab.bg values predate the Wave-style "bg@" prefix — strip it. */
const normalizeBgKey = (key: string) => (key.startsWith('bg@') ? key.slice(3) : key);

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

function parseSettings(raw: unknown): ConfigSettings {
  const s = asRecord(raw);
  const preset = str(s['tab:preset']);
  return {
    tabPreset: preset ? normalizeBgKey(preset) : null,
    termFontSize: num(s['term:fontsize']) ?? DEFAULT_SETTINGS.termFontSize,
    termTheme: str(s['term:theme']) ?? DEFAULT_SETTINGS.termTheme,
    blockBg: str(s['block:bgcolor']) ?? DEFAULT_SETTINGS.blockBg,
    blockBlur: typeof s['block:blur'] === 'boolean' ? s['block:blur'] : DEFAULT_SETTINGS.blockBlur,
    blockOpacity: num(s['block:opacity']) ?? DEFAULT_SETTINGS.blockOpacity,
    blockHighlight:
      typeof s['block:highlight'] === 'boolean'
        ? s['block:highlight']
        : DEFAULT_SETTINGS.blockHighlight,
  };
}

function parseBackgrounds(raw: unknown): BackgroundDef[] {
  return Object.entries(asRecord(raw))
    .flatMap(([key, v]) => {
      const o = asRecord(v);
      const bg = str(o.bg);
      if (!bg) return []; // entries without a "bg" are not renderable presets
      return {
        key: normalizeBgKey(key),
        name: str(o['display:name']) ?? key,
        order: num(o['display:order']) ?? 0,
        bg,
        opacity: num(o['bg:opacity']) ?? 1,
        accent: str(o.accent),
        highlightActive:
          typeof o['highlight:active'] === 'boolean' ? o['highlight:active'] : undefined,
        highlightColor: str(o['highlight:color']),
        highlightWidth: num(o['highlight:width']),
      };
    })
    .sort((a, b) => a.order - b.order);
}

/** ITheme color slots we copy from a Wave theme (gray/cmdtext/display:* dropped). */
const THEME_KEYS = [
  'foreground', 'background', 'cursor', 'cursorAccent', 'selectionBackground',
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
  'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
] as const;

function parseTermThemes(raw: unknown): TermThemeDef[] {
  return Object.entries(asRecord(raw))
    .map(([key, v]) => {
      const o = asRecord(v);
      const theme: ITheme = {};
      for (const k of THEME_KEYS) {
        const color = str(o[k]);
        if (color) theme[k] = color;
      }
      return {
        key,
        name: str(o['display:name']) ?? key,
        order: num(o['display:order']) ?? 0,
        theme,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function parseConfig(raw: unknown): AppConfig {
  const cfg = asRecord(raw);
  return {
    settings: parseSettings(cfg.settings),
    backgrounds: parseBackgrounds(cfg.backgrounds),
    termThemes: parseTermThemes(cfg.termThemes),
  };
}
