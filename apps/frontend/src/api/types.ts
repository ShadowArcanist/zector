// Mirrors the API contract in .ai/architecture.md — keep in sync.

export type Connection = {
  id: string; // uuid
  name: string;
  host: string;
  port: number; // default 22
  username: string;
  auth_type: 'password' | 'key';
  password: string | null;
  private_key: string | null; // PEM/OpenSSH text (legacy fallback when key_path is empty)
  key_path: string | null; // path to a private key on the host running zector (~ expanded server-side)
  key_passphrase: string | null;
  icon_color: string | null; // hex from connections/colors.ts; null = auto (hash-picked)
  icon: string | null; // key into connections/icons.ts; null = default (SwapIcon)
  created_at: string;
};

export type ConnectionInput = Omit<Connection, 'id' | 'created_at'>;

export type TestResult = { ok: true } | { ok: false; error: string };

export type FsEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  is_symlink: boolean;
  size: number;
  modified: number | null; // unix seconds
  mode?: number | null; // unix mode bits (e.g. 0o100644); null/absent when unknown
};

export type FsListing = { path: string; entries: FsEntry[] };

// ---- UI state blob (backend-opaque, stored via /api/state) ----

// `localName` is a user-chosen display name for the local target (default "Localhost");
// `localIcon` (key into connections/icons.ts, default laptop) and `localColor`
// (hex from connections/colors.ts, unset = muted) style everywhere local renders.
export type UiState = {
  tabs: Tab[];
  activeTabId: string | null;
  localName?: string;
  localIcon?: string;
  localColor?: string;
};

// Frontend extension over the architecture doc: `root` may be null for a
// freshly-created empty tab (renders a centered block picker). The blob is
// opaque to the backend so this is safe.
// `bg` is a key into the config background registry (per-tab workspace background).
export type Tab = { id: string; name: string; root: LayoutNode | null; bg?: string };

export type LayoutNode =
  | { type: 'split'; id: string; dir: 'row' | 'col'; children: LayoutNode[]; sizes: number[] }
  | { type: 'leaf'; id: string; block: Block };

export type LeafNode = Extract<LayoutNode, { type: 'leaf' }>;
export type SplitNode = Extract<LayoutNode, { type: 'split' }>;

// `title`, `fontSize` and `termTheme` are frontend-only extensions; the state
// blob is backend-opaque so older blobs still parse. `fontSize`/`termTheme`
// unset = follow the config defaults (settings.termFontSize / settings.termTheme).
export type Block =
  | {
      kind: 'terminal';
      target: string;
      termId: string;
      title?: string;
      fontSize?: number;
      termTheme?: string;
    }
  | { kind: 'files'; target: string; path: string; title?: string };

export type TerminalBlockData = Extract<Block, { kind: 'terminal' }>;
export type FilesBlockData = Extract<Block, { kind: 'files' }>;

/** Target is either the literal string 'local' or a saved connection id. */
export const LOCAL_TARGET = 'local';
