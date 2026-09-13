import { useEffect, useState } from 'react';
import { fsReadUrl } from '../../../api/fs';

/** Resolved file text keyed by `${target}\n${path}`, so reopening a file skips the refetch. */
const cache = new Map<string, string>();

/** Keep the cache in step with a save so the next open shows the written content. */
export function setFileTextCache(target: string, path: string, text: string) {
  cache.set(`${target}\n${path}`, text);
}

/** Fetch a file's raw text (when enabled); result is keyed so stale reads never leak. */
export function useFileText(target: string, path: string, enabled: boolean) {
  const [state, setState] = useState<{ key: string; text: string | null; error: string | null }>({
    key: '',
    text: null,
    error: null,
  });
  const key = `${target}\n${path}`;
  // Serve a cached read during render (like highlight.ts's htmlCache) so reopening
  // a file skips both the refetch and a redundant setState round-trip.
  const cached = enabled ? cache.get(key) : undefined;
  useEffect(() => {
    if (!enabled || cached !== undefined) return;
    let cancelled = false;
    fetch(fsReadUrl(target, path))
      .then(async (res) => {
        if (!res.ok) throw new Error(`could not read file (${res.status})`);
        return res.text();
      })
      .then((text) => {
        cache.set(key, text);
        if (!cancelled) setState({ key, text, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ key, text: null, error: err instanceof Error ? err.message : 'read failed' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [target, path, key, enabled, cached]);
  if (cached !== undefined) return { key, text: cached, error: null };
  return state.key === key ? state : { key, text: null, error: null };
}
