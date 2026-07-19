# Build plan — Zector v1

- [x] Decide stack + API contract (see architecture.md)
- [x] Add backend crates + frontend packages
- [ ] Backend: config, DB (migrations, connections, state)
- [ ] Backend: REST API (connections, fs local, fs sftp, state)
- [ ] Backend: terminal sessions (local PTY + SSH) over WebSocket
- [ ] Backend: static file serving (rust-embed) + SPA fallback
- [ ] Frontend: Tailwind dark theme, app shell, tabs
- [ ] Frontend: resizable split layout + block chrome
- [ ] Frontend: terminal block (xterm + WS + fit/webgl)
- [ ] Frontend: connection manager UI
- [ ] Frontend: file browser block (list, nav, upload/download, rename, delete, mkdir, editor, image preview)
- [ ] Persistence: state save/restore wiring
- [ ] Integration: vite proxy, embed build, end-to-end verify
- [ ] Docs: README + .ai updates

## Review notes

(fill in after verification)
