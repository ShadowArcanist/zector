# zector

Self-hosted web terminal for your local network. One small binary gives you a browser app with Wave-Terminal-style tabs and resizable split blocks, local + SSH terminals, a saved-connection manager, and a local/SFTP file browser.

> ⚠️ zector has **no authentication** by design — expose it only on a trusted local network.

## Features

- **Terminal** — real PTY shell on the host, plus SSH shells to saved servers (xterm.js, WebGL rendering). Sessions live server-side, so a browser refresh restores your scrollback.
- **SSH connection manager** — save servers with password or private-key auth, test connections, one click to open a terminal or file browser on them.
- **File browser** — browse local disk or any server over SFTP: upload (drag & drop), download, rename, move, delete, new folder, built-in text editor and image preview.
- **Workspace** — tabs across the top, blocks split horizontally/vertically with draggable resizing. Layout persists across restarts.

## Stack

- Backend: Rust — axum, russh (+ sftp), portable-pty, SQLite (rusqlite). Single process, frontend embedded via rust-embed.
- Frontend: React 19, xterm.js, Tailwind CSS 4, zustand, react-resizable-panels. Built with Vite + Bun.

## Build & run

```sh
# build frontend, then backend (frontend dist is embedded into the binary)
cd apps/frontend && bun install && bun run build
cd ../backend && cargo build --release

# run — listens on 0.0.0.0:7887
./target/release/backend
```

Environment: `ZECTOR_PORT` (default `7887`), `ZECTOR_DATA_DIR` (default: OS data dir, holds `zector.db`).

## Development

```sh
cd apps/backend && cargo run          # API on :7887
cd apps/frontend && bun run dev       # UI on :5173, proxies /api (incl. websockets)
```

Docs for contributors/AI agents live in [`.ai/`](.ai/architecture.md).
