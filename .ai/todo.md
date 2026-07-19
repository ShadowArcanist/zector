# Build plan — Zector v1

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
