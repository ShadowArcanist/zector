import { useEffect, useState } from 'react';
import { fsReadUrl } from '../../../api/fs';

/** Fetch a file's raw text (when enabled); result is keyed so stale reads never leak. */
export function useFileText(target: string, path: string, enabled: boolean) {
  const [state, setState] = useState<{ key: string; text: string | null; error: string | null }>({
    key: '',
    text: null,
    error: null,
  });
  const key = `${target}\n${path}`;
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(fsReadUrl(target, path))
      .then(async (res) => {
        if (!res.ok) throw new Error(`could not read file (${res.status})`);
        return res.text();
      })
      .then((text) => {
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
  }, [target, path, key, enabled]);
  return state.key === key ? state : { key, text: null, error: null };
}
