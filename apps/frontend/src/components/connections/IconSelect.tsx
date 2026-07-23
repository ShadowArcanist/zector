import { useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '../ui/icons/general';
import { SwapIcon } from '../ui/icons/terminal';
import type { IconProps } from '../ui/icons/Icon';
import { CONN_ICONS } from './icons';

/** Connection-icon dropdown: glyph + name button opening a grid of icon tiles. */
export function IconSelect({
  value,
  defaultIcon: DefaultIcon = SwapIcon, // glyph shown for the "Default" (null) entry
  onChange,
}: {
  value: string | null;
  defaultIcon?: ComponentType<IconProps>;
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

  const current = CONN_ICONS.find((i) => i.key === value);
  const CurrentIcon = current?.Icon ?? DefaultIcon;

  const pick = (key: string | null) => {
    onChange(key);
    setOpen(false);
  };

  const tile = (selected: boolean) =>
    `flex h-9 cursor-pointer items-center justify-center rounded-lg bg-white/4 transition-colors hover:bg-white/10 ${
      selected ? 'ring-2 ring-accent' : ''
    }`;

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
        <CurrentIcon size={14} className="shrink-0 text-fg-dim" />
        <span className="min-w-0 flex-1 truncate text-left">{current?.name ?? 'Default'}</span>
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
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              title="Default"
              className={tile(value === null)}
              onClick={() => pick(null)}
            >
              <DefaultIcon size={16} className="text-fg-dim" />
            </button>
            {CONN_ICONS.map(({ key, name, Icon }) => (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={key === value}
                title={name}
                className={tile(key === value)}
                onClick={() => pick(key)}
              >
                <Icon size={16} className="text-fg-dim" />
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
