import { useEffect, useRef, useState } from 'react';
import type { FsEntry } from '../../api/types';
import { fsHome, fsList, fsStat } from '../../api/fs';
import { fileIconUrl } from './fileIcons';
import { joinPath, parentPath } from './format';

function normalizePath(path: string) {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

function resolveEnteredPath(input: string, cwd: string, home?: string) {
  const value = input.trim();
  if (!value) return cwd;
  if (home && (value === '~' || value.startsWith('~/'))) {
    return normalizePath(`${home}${value.slice(1)}`);
  }
  if (value.startsWith('/')) return normalizePath(value);
  return normalizePath(joinPath(cwd, value));
}

function suggestionQuery(input: string, cwd: string, home?: string) {
  const value = input.trim();
  if (!value) return { dir: cwd, prefix: '' };
  const resolved = resolveEnteredPath(value, cwd, home);
  if (value === '~' || value.endsWith('/')) return { dir: resolved, prefix: '' };
  return { dir: parentPath(resolved), prefix: resolved.split('/').pop() ?? '' };
}

export function FilePathControl({
  target,
  cwd,
  home,
  onOpen,
  onClose,
}: {
  target: string;
  cwd: string;
  home?: string;
  onOpen: (entry: FsEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FsEntry[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchedHome, setFetchedHome] = useState<string>();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveHome = home ?? fetchedHome;

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (home) return;
    void fsHome(target).then((result) => setFetchedHome(result.path)).catch(() => {});
  }, [home, target]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const { dir, prefix } = suggestionQuery(query, cwd, effectiveHome);
      setLoading(true);
      setError('');
      void fsList(target, dir)
        .then((result) => {
          if (cancelled) return;
          const needle = prefix.toLowerCase();
          setSuggestions(
            result.entries
              .filter((entry) => entry.name.toLowerCase().startsWith(needle))
              .slice(0, 12),
          );
          setSelected(0);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, target, cwd, effectiveHome]);

  const choose = (entry: FsEntry) => {
    onOpen(entry);
    onClose();
  };

  const submit = async () => {
    const suggestion = suggestions[selected];
    if (suggestion) {
      choose(suggestion);
      return;
    }
    setLoading(true);
    setError('');
    try {
      choose(await fsStat(target, resolveEnteredPath(query, cwd, effectiveHome)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Path not found');
      setLoading(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="absolute top-[calc(100%+4px)] left-2 z-50 w-96 max-w-[calc(100%-1rem)] overflow-hidden rounded-xl border border-white/6 bg-menu shadow-modal"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="p-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setSelected((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setSelected((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              void submit();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            } else if (event.key === 'Tab' && suggestions[selected]) {
              event.preventDefault();
              const entry = suggestions[selected];
              setQuery(entry.is_dir ? `${entry.path}/` : entry.path);
            }
          }}
          placeholder="Open File..."
          aria-label="Open file or directory"
          className="h-8 w-full rounded-lg border border-white/8 bg-bg0 px-3 text-[12px] font-normal text-fg outline-none placeholder:text-fg-faint focus:border-accent"
        />
      </div>
      {error && <div className="px-3 pb-2 text-[11px] font-normal text-danger">{error}</div>}
      {!error && suggestions.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t border-white/6 py-1">
          {suggestions.map((entry, index) => (
            <button
              type="button"
              key={entry.path}
              onMouseEnter={() => setSelected(index)}
              onClick={() => choose(entry)}
              className={`flex h-8 w-full cursor-pointer items-center gap-2 px-3 text-left font-normal transition-colors ${
                index === selected ? 'bg-white/10' : 'hover:bg-white/8'
              }`}
            >
              <img
                src={fileIconUrl(entry.name, entry.is_dir)}
                alt=""
                aria-hidden
                className="h-4 w-4 shrink-0"
              />
              <span className="min-w-0 flex-1 truncate text-[12px] text-fg">{entry.name}</span>
              <span className="max-w-[45%] truncate text-[10px] text-fg-faint">{entry.path}</span>
            </button>
          ))}
        </div>
      )}
      {!error && !loading && suggestions.length === 0 && query && (
        <div className="border-t border-white/6 px-3 py-3 text-center text-[11px] font-normal text-fg-faint">
          Press Enter to open this path
        </div>
      )}
    </div>
  );
}
