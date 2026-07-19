/**
 * Per-tab workspace background presets (imported from the user's Wave Terminal
 * bg@* presets). The gradient renders behind the tab bar and the translucent
 * blocks at the given opacity; "Default" (no preset) clears it.
 */
export type BgPreset = { name: string; order: number; bg: string; opacity: number };

// prettier-ignore
export const BG_PRESETS: Record<string, BgPreset> = {
  'shadows-midnight': {
    name: "Shadow's Midnight", order: 0.1, opacity: 0.9,
    bg: 'linear-gradient(135deg, #2a3b4c, rgba(42, 59, 76, 0.4))',
  },
  'shadows-golden-hour': {
    name: "Shadow's Golden Hour", order: 0.2, opacity: 0.4,
    bg: 'linear-gradient(135deg, #d58a42, rgba(213, 138, 66, 0.4))',
  },
  'shadows-cosmic-purple': {
    name: "Shadow's Cosmic Purple", order: 0.3, opacity: 0.8,
    bg: 'linear-gradient(135deg, #5d3e66, rgba(93, 62, 102, 0.4))',
  },
  'shadows-neon-glow': {
    name: "Shadow's Neon Glow", order: 0.4, opacity: 0.45,
    bg: 'linear-gradient(135deg, #f300a6, rgba(243, 0, 166, 0.3))',
  },
  'shadows-icy-mist': {
    name: "Shadow's Icy Mist", order: 0.5, opacity: 0.5,
    bg: 'linear-gradient(135deg, #d0d8e2, rgba(208, 216, 226, 0.2))',
  },
  'shadows-tropical-storm': {
    name: "Shadow's Tropical Storm", order: 0.6, opacity: 0.3,
    bg: 'linear-gradient(135deg, #00b894, #1fa771, #2ecc71, #27ae60)',
  },
  'shadows-golden-nebula': {
    name: "Shadow's Golden Nebula", order: 0.7, opacity: 0.44,
    bg: 'linear-gradient(135deg, #ffd700, #ff6347, #d4a20e, #ffcc00, #1f3d6f)',
  },
  'shadows-cosmic-lagoon': {
    name: "Shadow's Cosmic Lagoon", order: 0.8, opacity: 0.59,
    bg: 'linear-gradient(135deg, #1d2b64, #2f4f96, #00b5b8, #9c27b0, #8e24aa)',
  },
  'shadows-neon-nebula': {
    name: "Shadow's Neon Nebula", order: 0.9, opacity: 0.6,
    bg: 'linear-gradient(135deg, #00d9d9, #ff55aa, #1e1e2f, #2f3b57, #ff99ff)',
  },
};

export const BG_PRESET_KEYS = Object.keys(BG_PRESETS).sort(
  (a, b) => BG_PRESETS[a].order - BG_PRESETS[b].order,
);
