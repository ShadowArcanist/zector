# Ideas / backlog

## Auto-redactor (user-requested, parked 2026-07-19 — revisit later)

Goal: user maintains a list of secrets; the app masks them (asterisks or a user-provided dummy value)
wherever they would appear on screen — primarily terminal output.

Agreed design sketch (discussed with user):
- Rules in SQLite: `{ id, secret, replacement (default "●●●●●"), enabled }`. CRUD via REST; UI as a
  "Redactions" section in the settings-style Connections/Settings dialog. `ui/Toggle.tsx` already exists
  (built for this — currently has no call site) for per-rule enable/disable.
- Redact in the BACKEND terminal stream, before bytes hit the WebSocket (term/ session broadcast +
  scrollback buffer). Server-side covers live output AND the scrollback replay on refresh, all clients.
- Streaming matcher: secrets can span two output chunks — hold back up to (longest secret − 1) bytes,
  flush on a short timer (~10–20 ms) so the prompt doesn't lag. Aho-Corasick or simple multi-needle scan
  (rule counts are tiny).
- Known limitations (accepted): secrets interleaved with ANSI escapes mid-string can escape matching;
  redaction happens in the scrollback buffer too, so replays are also masked (good).
- Scope v1: terminals only. Do NOT redact the file editor (saving would write dummy values back into
  real files). A read-only redaction for file previews could be a later opt-in.

## Other parked notes
- Multi-window session contention: one attached WS per terminal; two browser windows fight (last wins).
- File-table column widths are in-memory only; could persist per block in the state blob.
- Transparent terminals (tab bg) use the DOM renderer — slower on very heavy output than WebGL.
