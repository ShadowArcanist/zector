import { apiJson } from './http';

/** ws(s):// URL on the same origin for a terminal session. */
export function termWsUrl(termId: string, target: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const q = `term_id=${encodeURIComponent(termId)}&target=${encodeURIComponent(target)}`;
  return `${proto}//${window.location.host}/api/term/ws?${q}`;
}

/** Kill a terminal session (called when a terminal block is closed). */
export function killTerm(termId: string): Promise<void> {
  return apiJson('DELETE', `/api/term/${encodeURIComponent(termId)}`);
}
