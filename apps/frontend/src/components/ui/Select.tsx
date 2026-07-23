import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronDownIcon } from './icons/general';

/**
 * Custom dropdown (no native <select>): pill button opening a portal menu,
 * so it never clips inside scrollable settings panes.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
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
    // capture-phase so clicks/scrolls anywhere (incl. inside modals) close it,
    // but never on interactions with the menu itself
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

  const current = options.find((o) => o.value === value);

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
        <span className="min-w-0 flex-1 truncate text-left">{current?.label ?? value}</span>
        <ChevronDownIcon size={13} className="text-fg-faint" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="motion-popover fixed z-100 min-w-[220px] rounded-xl border border-white/6 bg-menu py-1.5 shadow-modal"
            style={{ top: pos.top, right: pos.right }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className="flex h-8 w-full cursor-pointer items-center gap-2 px-3 text-left text-[13px] text-fg-dim hover:bg-white/8 hover:text-fg"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="flex w-4 shrink-0 justify-center">
                  {opt.value === value && <CheckIcon size={13} className="text-fg" />}
                </span>
                {opt.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
