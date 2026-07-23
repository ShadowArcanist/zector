import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '../ui/icons/general';
import { CONN_COLORS } from './colors';

/** Icon-color dropdown: swatch + name button opening a grid of color dots. */
export function ColorSelect({
  value,
  autoColor,
  onChange,
}: {
  value: string | null;
  autoColor: string; // effective color shown when value is null
  onChange: (value: string | null) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) =>
      (t instanceof Node && menuRef.current?.contains(t)) || buttonRef.current?.contains(t as Node);
    const onDown = (e: MouseEvent) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) setOpen(false);
    };
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const currentName = CONN_COLORS.find((c) => c.value === value)?.name ?? 'Auto';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 w-[220px] cursor-pointer items-center gap-2 rounded-lg bg-white/5 px-3 text-[13px] text-fg transition-colors hover:bg-white/8"
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: value ?? autoColor }}
        />
        <span className="min-w-0 flex-1 truncate text-left">{currentName}</span>
        <ChevronDownIcon size={13} className="text-fg-faint" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="motion-popover fixed z-100 grid w-[220px] grid-cols-4 gap-1.5 rounded-xl border border-white/6 bg-menu p-2 shadow-modal"
            style={{ top: pos.top, right: pos.right }}
          >
            {CONN_COLORS.map((c) => {
              const selected = c.value === value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  title={c.name}
                  className={`flex h-9 cursor-pointer items-center justify-center rounded-lg bg-white/4 transition-colors hover:bg-white/10 ${
                    selected ? 'ring-2 ring-accent' : ''
                  }`}
                  onClick={() => {
                    onChange(c.value);
                    setOpen(false);
                  }}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: c.value }} />
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
