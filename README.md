# Zector

Zector is a self-hosted browser workspace for local and SSH terminals, remote connections, and file management.

Run one small binary on your Mac, open Zector in a browser, then work across tabs and resizable terminal or file blocks without installing an agent on your servers.

<img src="/.github/screenshot.png" alt="Zector UI"/>

> [!IMPORTANT]
> Zector has no authentication by design. Only run it on a trusted local network and never expose it directly to the public internet.
>
> This project was entirely created using AI, but the application has been thoroughly tested.
>
> This project was built primarily for my personal use, so I will not be merging pull requests or adding new features unless I need them myself. If you want to make changes or add features, feel free to fork this repository.

## Features

- Local terminal sessions with persistent scrollback
- SSH terminals using saved password or private-key connections
- Local and SFTP file explorer
- Built-in text editor with syntax highlighting
- Upload, download, rename, create, and delete files or folders
- Tabs with resizable split blocks
- Reorderable and customizable connections
- Command palette
- User-editable themes and settings
- One binary with the frontend embedded

## Requirements

- Apple Silicon Mac
- A modern browser

Linux and Windows releases are not available yet.

## Install

Download `zector-macos-arm64.tar.gz` from the latest GitHub release, then run:

```bash
tar -xzf zector-macos-arm64.tar.gz
chmod +x zector
sudo mv zector /usr/local/bin/zector
```

If macOS blocks the downloaded binary because it is not notarized:

```bash
xattr -d com.apple.quarantine /usr/local/bin/zector
```

## Usage

Start Zector in the background:

```bash
zector start
```

Open http://localhost:7887 in your browser. Other devices on the same trusted network can use `http://<your-mac-ip>:7887`.

Check whether it is running:

```bash
zector status
```

Stop it:

```bash
zector stop
```

Run it in the foreground instead:

```bash
zector -f
```

Press `Ctrl+C` to stop foreground mode. Background logs are written to `~/Library/Application Support/zector/zector.log`.

## Configuration

Shareable configuration lives in `~/.config/zector/`:

- `connections.json`
- `settings.json`
- `terminal-themes.json`
- `themes.json`

Internal workspace state is stored separately in SQLite under the macOS application data directory.

Available environment variables:

- `ZECTOR_PORT` — listening port, default `7887`
- `ZECTOR_CONFIG_DIR` — user-editable configuration directory
- `ZECTOR_DATA_DIR` — internal data, PID, and log directory

## Build from source

Requirements:

- Rust stable
- Bun

Build the frontend before the backend because the frontend is embedded in the Rust binary:

```bash
cd apps/frontend
bun install
bun run build

cd ../backend
cargo build --release
```

The binary is written to `apps/backend/target/release/zector`.

## Local development

From the repository root:

```bash
task dev
```

Or run each side separately:

```bash
cd apps/backend && cargo run -- -f
cd apps/frontend && bun run dev
```

The frontend development server proxies API and WebSocket requests to the backend.

## Publishing a release

Push a version tag to build and publish the Apple Silicon binary automatically:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The release workflow can also be started manually from the GitHub Actions page with a release tag.

## License

MIT. See [LICENSE](./LICENSE).
