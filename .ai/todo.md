# Build plan — Zector v1

## Round (2026-07-20, part 3) — DONE
File explorer uses material-icon-theme (npm dep; lookup adapted from reference/gitbase in files/fileIcons.ts;
vite assetsInlineLimit 0 so ~1250 svgs are separate on-demand assets, also embedded by rust-embed).
Header right-click toggles column visibility (Perm/Last Modified/Size/Type; persisted as
UiState.hiddenFileColumns). ConnectionButton: dangling targets (deleted connections) now still show a
fallback name instead of looking like an icon-only local chip.

## Round (2026-07-20, part 2): wave-style config files — DONE
UI layout state moved OUT of ~/.config/zector back into sqlite (data dir zector.db; state.json auto-imported
then deleted — configs are for sharing, layout is not). New user-editable configs seeded on first run:
settings.json / terminal-themes.json / backgrounds.json (Wave formats; GET /api/config parses fresh so hand
edits apply on page refresh; frontend store/config.ts + api/config.ts). Resolution: per-tab bg and per-block
fontSize/termTheme override settings defaults; block:bgcolor/opacity/blur are global (CSS vars --color-block,
--block-blur). Terminal Themes submenu is back, fed by the registry (built-in "Graphite" + user themes).
Localhost got icon/color customization (localIcon/localColor in state blob, rows in LocalPane).

## Round (2026-07-20): icons, json configs, no-flash moves — DONE
Per-connection icon picker (connections/icons.ts registry + IconSelect grid; `icon` field end-to-end).
Backend storage moved from SQLite to JSON files in ~/.config/zector (connections.json, state.json;
atomic writes; one-time sqlite import then .db.bak; see db/ module). Dynamic tab widths. Lighter blocks
(rgba(0,0,0,0.25)) + brighter file table text/header. Block headers: no view icon, title only when
user-renamed, remote chip name tinted with connColor. NO-FLASH MOVES: terminal xterm+WS live in a
module registry (terminal/termSessions.ts) keyed by termId — components adopt/release (5s park timer,
killTerm hook disposes); files listings cached per leafId in filesNav store. Only remaining flash:
toggling tab background (WebGL<->DOM renderer swap).

## Theme system removal (2026-07-19) — DONE
Per user decision: no UI themes, no per-terminal theme presets — tab background presets are the ONLY
visual customization. Deleted styles/uiThemes.ts; terminal/themes.ts is now a single fixed ITheme + font
constants. Follow-up: user picked "neutral graphite" as the fixed look (was Tokyo Night briefly) —
near-black neutral grays, #4c8dff accent, Wave-default-dark-style ANSI colors on #141414. Removed: palette button, UI Theme submenu, terminal Themes submenu, setTermTheme,
uiTheme/termTheme fields. Old state blobs with those fields still load (fields ignored).
Auto-redactor idea parked in ideas.md.

## Tab background presets (2026-07-19) — DONE
User's Wave bg@* presets ported to styles/bgPresets.ts (9 "Shadow's ..." gradients w/ opacity). Per-tab
`bg` key on Tab (validated in uiState parse), applied as a fixed gradient layer behind tab bar + blocks
(App WorkspaceBg). Picker: tab right-click → Background submenu.
Follow-up fix: when the active tab has a bg preset, terminals switch to the DOM renderer (WebGL cannot do
transparency) with xterm bg #00000000 + allowTransparency + a global `.xterm-viewport { background:
transparent !important }` override (xterm ships a stock black viewport bg; Wave overrides it the same way).
Renderer swap recreates the xterm instance; sessions survive via server-side scrollback replay. The files
table sticky header is bg-black/40 + backdrop-blur (was opaque block-flat) so gradients show through.

## Feature round (2026-07-19): drag-rearrange, fonts, local rename, key path, column resize — DONE
Pointer-based block drag (grab header, 4-edge drop zones w/ accent half-overlay, moveLeafInTree keeps leaf id
so terminal sessions survive; store/uiState.ts extracted from layout.ts). Terminal default font 13px/500 (bold 700).
localName in state blob + pinned "Local machine" rename row in Connections modal. SSH keys referenced by
key_path on the zector host (backend reads file, ~ expanded; pasted private_key kept as legacy fallback;
additive ALTER TABLE migration). File table columns drag-resizable (widths in filesNav store, dbl-click reset).

## UI themes + focus ring removal (2026-07-19) — DONE
App-shell theme presets in frontend styles/uiThemes.ts (8 themes mirroring the terminal presets; applied by
overriding Tailwind @theme CSS vars inline on <html>; persisted as uiTheme in the state blob). Switcher:
palette icon in tab bar + "UI Theme" submenu on tab-bar right-click. UI theme also sets the DEFAULT terminal
theme (per-block termTheme still overrides). Focused-block accent border removed (focus is still tracked,
just not drawn). xterm now gets the real theme background — the transparent-bg trick broke under WebGL.

## Visual parity pass (2026-07-19, after user screenshot comparison) — DONE
Files block rebuilt as Wave's directory preview: navigation (back/forward/refresh + ~-relative path) lives
in the BLOCK HEADER (BlockHeader accepts view-specific content), toolbar row removed, real table with sortable
Name/Perm/Last Modified/Size/Type columns (mode field added to backend fs list), ".." row, 24px rows,
keyboard nav (arrows/Enter/Backspace). Terminal title "Localhost"/connection name (bright, not muted);
local connection chip is icon-only. Tabs contiguous with dividers. New files nav store: store/filesNav.ts.

## UI rework (2026-07-19, after v1) — DONE
Wave-Terminal-exact structure with Tokyo Night palette: brandless 33px tab bar, 30px block headers
(icon + connection switcher + renameable title + split/close icons), 2px accent focus border, 3px block gaps,
custom context menus everywhere (tabs, tab bar, block header, terminal, file list), 9 terminal theme presets
(Wave's 7 + Tokyo Night default) with per-block theme/font-size via terminal right-click.
Design specs extracted from reference/waveterm-dev (theme.scss, tab.scss, block.scss, termthemes.json).
Note: terminal sessions allow ONE attached websocket — two browser windows on the same layout fight over
sessions (last attacher wins after the other's 5 reconnect tries). Known v1 limitation.

- [x] Decide stack + API contract (see architecture.md)
- [x] Add backend crates + frontend packages
- [x] Backend: config, DB (migrations, connections, state)
- [x] Backend: REST API (connections, fs local, fs sftp, state)
- [x] Backend: terminal sessions (local PTY + SSH) over WebSocket
- [x] Backend: static file serving (rust-embed) + SPA fallback
- [x] Frontend: Tailwind dark theme, app shell, tabs
- [x] Frontend: resizable split layout + block chrome
- [x] Frontend: terminal block (xterm + WS + fit/webgl)
- [x] Frontend: connection manager UI
- [x] Frontend: file browser block (list, nav, upload/download, rename, delete, mkdir, editor, image preview)
- [x] Persistence: state save/restore wiring
- [x] Integration: vite proxy, embed build, end-to-end verify
- [x] Docs: README + Taskfile + .ai updates

## Review notes (2026-07-19)

Verified end-to-end on macOS:
- `cargo check`/`build` clean (0 warnings); `bun run build` + `bun run lint` clean.
- REST verified with curl: connections CRUD, state round-trip, local fs home/list/read/write/mkdir/rename/recursive delete, content-type + download headers.
- Terminal WS verified twice: raw bun WS client (live output, scrollback replay on reattach, DELETE kill) and a real headless-Chromium session (click, type, echo rendered, scrollback restored after page reload, no console errors).
- Release binary (9.6 MB) runs standalone from any cwd, serves embedded frontend + API.

Known gaps / follow-ups:
- SSH terminal + SFTP paths implemented per russh 0.62 source but NOT tested against a real SSH server (none reachable during build). Test with a real host; watch: auth failures surface as `{"type":"error"}` frame / `{ok:false}` on test endpoint.
- xterm WebGL renderer draws to canvas — DOM `.xterm` textContent is empty; any future UI automation must assert via screenshots or pixel checks, not textContent.
- Frontend bundle is one ~750 KB chunk (xterm+react); fine for LAN, could code-split later.
- `apps/frontend/dist/index.html` placeholder is gitignored but must exist for backend compile; `bun run build` overwrites it.
