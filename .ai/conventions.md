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

## Style
- Dark theme only. Tailwind utility classes; shared design tokens in `src/styles/`.
- No tests unless they materially speed up development.
- Frontend package manager is Bun (`bun add`, `bun run`). Never npm/yarn/pnpm. Don't bypass Bun's security defaults; if Bun blocks a too-new package, pin an older version.
- Keep dependencies minimal; prefer std/axum/tokio built-ins over new crates.

## Reference codebases
- `reference/waveterm-dev` (Go/React desktop terminal) and `reference/Nexterm` (Node/React web SSH manager) are inspiration only. Never import from or modify them.
