import { apiJson } from './http';

/** ws(s):// URL on the same origin for a terminal session. */
export function termWsUrl(termId: string, target: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const q = `term_id=${encodeURIComponent(termId)}&target=${encodeURIComponent(target)}`;
  return `${proto}//${window.location.host}/api/term/ws?${q}`;
}

// Registered by the frontend terminal session registry so killing a backend
// session also tears down the matching live xterm instance immediately.
let killListener: ((termId: string) => void) | null = null;

export function onTermKill(listener: (termId: string) => void) {
  killListener = listener;
}

/** Kill a terminal session (called when a terminal block is closed/restarted). */
export function killTerm(termId: string): Promise<void> {
  killListener?.(termId);
  return apiJson('DELETE', `/api/term/${encodeURIComponent(termId)}`);
}
