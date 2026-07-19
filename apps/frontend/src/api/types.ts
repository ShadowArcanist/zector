// Mirrors the API contract in .ai/architecture.md — keep in sync.

export type Connection = {
  id: string; // uuid
  name: string;
  host: string;
  port: number; // default 22
  username: string;
  auth_type: 'password' | 'key';
  password: string | null;
  private_key: string | null; // PEM/OpenSSH text
  key_passphrase: string | null;
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
};

export type FsListing = { path: string; entries: FsEntry[] };

// ---- UI state blob (backend-opaque, stored via /api/state) ----

export type UiState = { tabs: Tab[]; activeTabId: string | null };

// Frontend extension over the architecture doc: `root` may be null for a
// freshly-created empty tab (renders a centered block picker). The blob is
// opaque to the backend so this is safe.
export type Tab = { id: string; name: string; root: LayoutNode | null };

export type LayoutNode =
  | { type: 'split'; id: string; dir: 'row' | 'col'; children: LayoutNode[]; sizes: number[] }
  | { type: 'leaf'; id: string; block: Block };

export type LeafNode = Extract<LayoutNode, { type: 'leaf' }>;
export type SplitNode = Extract<LayoutNode, { type: 'split' }>;

export type Block =
  | { kind: 'terminal'; target: string; termId: string }
  | { kind: 'files'; target: string; path: string };

export type TerminalBlockData = Extract<Block, { kind: 'terminal' }>;
export type FilesBlockData = Extract<Block, { kind: 'files' }>;

/** Target is either the literal string 'local' or a saved connection id. */
export const LOCAL_TARGET = 'local';
