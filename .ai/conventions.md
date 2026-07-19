# Conventions

## Git
- Small commits, format `type(scope): message` — no body/description, no co-author/identity lines.
- Scopes used so far: `repo`, `backend`, `frontend`, `docs`.
- Commits are SSH-signed automatically (already configured).

## Code organization
- No big files: split by feature into nested folders. Aim for < ~200 lines per file.
- Backend: `src/db/`, `src/api/`, `src/term/`, `src/ssh/` modules; `main.rs` only wires things together.
- Frontend: `src/api/` (fetch wrappers), `src/store/` (zustand), `src/components/<feature>/`, `src/hooks/`.
- TypeScript strict; types for API payloads live in `src/api/types.ts` and must match `.ai/architecture.md`.

## Icons
- Own icon system in `src/components/ui/icons/` (createIcon helper + per-area defs). SVG bodies are copied
  from `apps/frontend/assets/reicon-icons/{filled,outline}` (gitignored, never imported/bundled) with all
  fills rewritten to `currentColor`. Prefer FILLED variants; outline only for thin glyphs (chevrons, x, plus).
  No icon libraries (lucide was removed).

## Modals
- Settings-dialog style (see ui/Modal.tsx, ui/Settings.tsx, ui/Toggle.tsx): 20px radius, soft double shadow,
  hairline white/6 dividers, sidebar+content two-pane where it fits, 48px rows (label left, control right),
  segmented pills, iOS-style Toggle. Context menus are a separate Wave-style system — do not restyle them.

## Style
- Dark theme only. Tailwind utility classes; shared design tokens in `src/styles/`.
- No tests unless they materially speed up development.
- Frontend package manager is Bun (`bun add`, `bun run`). Never npm/yarn/pnpm. Don't bypass Bun's security defaults; if Bun blocks a too-new package, pin an older version.
- Keep dependencies minimal; prefer std/axum/tokio built-ins over new crates.

## Reference codebases
- `reference/waveterm-dev` (Go/React desktop terminal) and `reference/Nexterm` (Node/React web SSH manager) are inspiration only. Never import from or modify them.
