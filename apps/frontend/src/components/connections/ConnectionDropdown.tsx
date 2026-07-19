import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, Laptop, Plus } from 'lucide-react';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { connColor } from './colors';

type Option =
  | { kind: 'local' }
  | { kind: 'conn'; id: string; name: string; sub: string }
  | { kind: 'new' };

type Props = {
  anchorRef: RefObject<HTMLButtonElement | null>;
  current: string;
  onSelect: (target: string) => void;
  onNew: () => void;
  onClose: () => void;
};

const WIDTH = 280;

/** Wave-style typeahead dropdown for picking a block's connection target. */
export function ConnectionDropdown({ anchorRef, current, onSelect, onNew, onClose }: Props) {
  const connections = useConnectionsStore((s) => s.connections);
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);

  // anchor under the connection button once mounted (DOM-only, no re-render)
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    el.style.left = `${Math.max(4, Math.min(rect?.left ?? 0, window.innerWidth - WIDTH - 8))}px`;
    el.style.top = `${(rect?.bottom ?? 0) + 4}px`;
    el.style.visibility = 'visible';
  }, [anchorRef]);

  const q = query.trim().toLowerCase();
  const options: Option[] = [
    ...(!q || `local ${localName}`.toLowerCase().includes(q) ? [{ kind: 'local' } as const] : []),
    ...connections
      .filter((c) => !q || `${c.name} ${c.username}@${c.host}`.toLowerCase().includes(q))
      .map((c) => ({
        kind: 'conn' as const,
        id: c.id,
        name: c.name,
        sub: `${c.username}@${c.host}`,
      })),
    { kind: 'new' },
  ];
  const highlight = Math.min(hi, options.length - 1);

  const pick = (opt: Option) => {
    if (opt.kind === 'new') onNew();
    else onSelect(opt.kind === 'local' ? 'local' : opt.id);
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as globalThis.Node;
      if (!panelRef.current?.contains(t) && !anchorRef.current?.contains(t)) onClose();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('blur', onClose);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose, anchorRef]);

  const rowClass = (active: boolean, isCurrent: boolean) =>
    `flex h-[30px] w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[12px] ${
      active ? 'bg-hover text-fg' : isCurrent ? 'text-fg' : 'text-fg-dim'
    }`;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[70] rounded-md border border-edge2 bg-bg1 shadow-modal"
      style={{ width: WIDTH, visibility: 'hidden' }}
    >
      <div className="border-b border-white/8 p-1.5">
        <input
          autoFocus
          value={query}
          placeholder="Filter connections…"
          className="h-7 w-full rounded-[4px] border border-edge2 bg-black/20 px-2 text-[12px] text-fg outline-none placeholder:text-fg-faint focus:border-accent"
          onChange={(e) => {
            setQuery(e.target.value);
            setHi(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHi((n) => (n + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHi((n) => (n - 1 + options.length) % options.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (options[highlight]) pick(options[highlight]);
            } else if (e.key === 'Escape') {
              e.stopPropagation();
              onClose();
            }
          }}
        />
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {options.map((opt, i) => {
          if (opt.kind === 'new') {
            return (
              <div key="new" className={i > 0 ? 'mt-1 border-t border-white/8 pt-1' : ''}>
                <button
                  type="button"
                  className={rowClass(i === highlight, false)}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(opt)}
                >
                  <Plus size={14} className="shrink-0 text-fg-faint" />
                  New connection…
                </button>
              </div>
            );
          }
          const isLocal = opt.kind === 'local';
          const isCurrent = isLocal ? current === 'local' : current === opt.id;
          return (
            <button
              key={isLocal ? 'local' : opt.id}
              type="button"
              className={rowClass(i === highlight, isCurrent)}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(opt)}
            >
              {isLocal ? (
                <Laptop size={14} className="shrink-0 text-fg-dim" />
              ) : (
                <ArrowRightLeft size={14} className="shrink-0" style={{ color: connColor(opt.id) }} />
              )}
              <span className="truncate">{isLocal ? localName : opt.name}</span>
              {!isLocal && (
                <span className="ml-auto max-w-[45%] truncate font-mono text-[10px] text-fg-faint">
                  {opt.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
