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

Zector creates its configuration files in `~/.config/zector/` on first launch. Existing files are never overwritten, so they can be edited, backed up, or copied to another machine.

Refresh the browser after changing settings or themes. Connections should normally be edited through the Zector UI because `connections.json` is loaded when the server starts.

### `settings.json`

Controls the default tab, terminal, and block appearance:

```json
{
  "tab:preset": "shadows-golden-hour",
  "term:fontsize": 13,
  "term:theme": "default",
  "block:bgcolor": "#000000",
  "block:blur": false,
  "block:opacity": 0.25,
  "block:highlight": true,
  "redact:ips": ["203.0.113.10", "2001:db8::10"]
}
```

| Setting | Description |
| --- | --- |
| `tab:preset` | Theme key assigned to newly created tabs. Use `null` for no preset. |
| `term:fontsize` | Default terminal font size. A terminal block can override it. |
| `term:theme` | Default key from `terminal-themes.json`. `default` selects Graphite. |
| `block:bgcolor` | Background color applied to every block. |
| `block:blur` | Adds backdrop blur behind every block. |
| `block:opacity` | Opacity applied when `block:bgcolor` is a hexadecimal color. |
| `block:highlight` | Globally enables the focused-block border. |
| `redact:ips` | Exact IPv4 or IPv6 values replaced with `REDACTED` in terminal output. This is display-only; it does not alter the remote session. |

### `themes.json`

Defines tab background presets and their matching accent colors. Zector includes:

- Midnight
- Golden Hour
- Cosmic Purple
- Neon Glow
- Icy Mist
- Tropical Storm
- Golden Nebula
- Cosmic Lagoon
- Neon Nebula
- Blur Black

Each top-level key is the value used by `tab:preset`. You can add your own preset using the same format:

```json
{
  "my-theme": {
    "display:name": "My Theme",
    "display:order": 11,
    "bg": "linear-gradient(135deg, #1d2b64, #00b5b8)",
    "bg:opacity": 0.6,
    "accent": "#00b5b8",
    "highlight:active": true,
    "highlight:color": "#00b5b8",
    "highlight:width": 2
  }
}
```

| Setting | Description |
| --- | --- |
| `display:name` | Name shown in the Themes menu. |
| `display:order` | Position in the Themes menu. |
| `bg` | CSS color or gradient rendered behind the tab. |
| `bg:opacity` | Theme background opacity. |
| `accent` | Accent used for resize handles, selections, and active controls. |
| `highlight:active` | Enables the focused-block border for this theme. |
| `highlight:color` | Focused-block border color. Defaults to `accent`. |
| `highlight:width` | Focused-block border width in pixels. |

### `terminal-themes.json`

Defines xterm-compatible terminal color schemes. Zector always includes the built-in `default` Graphite theme, and ships with Zed Dark as an additional preset:

```json
{
  "zed-dark": {
    "display:name": "Zed Dark",
    "display:order": 3,
    "background": "#0E100F",
    "foreground": "#CECDC3",
    "cursor": "#CECDC3",
    "black": "#0E100F",
    "red": "#D14D41",
    "green": "#879A39",
    "yellow": "#D0A215",
    "blue": "#4385BE",
    "magenta": "#3AA99F",
    "cyan": "#3AA99F",
    "white": "#CECDC3",
    "brightBlack": "#1e201f",
    "brightRed": "#D14D41",
    "brightGreen": "#879A39",
    "brightYellow": "#D0A215",
    "brightBlue": "#4385BE",
    "brightMagenta": "#3AA99F",
    "brightCyan": "#3AA99F",
    "brightWhite": "#CECDC3"
  }
}
```

The top-level key is used by `term:theme`. `display:name` and `display:order` control how the theme appears in the terminal Themes menu.

### `connections.json`

Stores saved SSH connections in their displayed order. Zector manages this file through the Connections dialog.

> [!WARNING]
> Passwords, private keys, and key passphrases are stored as plain text. Never publish `connections.json` or include it in a public backup.

### Internal state

Tabs, split layouts, open blocks, and other workspace state are not part of the shareable configuration. They are stored in SQLite under the macOS application data directory:

```text
~/Library/Application Support/zector/zector.db
```

Available environment variables:

- `ZECTOR_PORT` — listening port, default `7887`
- `ZECTOR_CONFIG_DIR` — user-editable configuration directory
- `ZECTOR_DATA_DIR` — internal data, PID, and log directory

## Build from source

Requirements:

- Rust stable
- [aube](https://aube.sh)

Build the frontend before the backend because the frontend is embedded in the Rust binary:

```bash
cd apps/frontend
aube install
aube run build

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
cd apps/frontend && aube run dev
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
