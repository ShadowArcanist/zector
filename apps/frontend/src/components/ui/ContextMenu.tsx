import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight } from 'lucide-react';
import {
  useContextMenuStore,
  type MenuEntry,
  type MenuItem,
} from '../../store/contextMenu';

const PANEL_CLASS =
  'min-w-44 rounded-md border border-edge2 bg-bg1 py-1 shadow-modal';

function ItemRow({
  item,
  hasChecks,
  onDone,
}: {
  item: MenuItem;
  hasChecks: boolean;
  onDone: () => void;
}) {
  const [subOpen, setSubOpen] = useState(false);
  const [subLeft, setSubLeft] = useState(true); // submenu opens to the right unless flipped
  const rowRef = useRef<HTMLDivElement>(null);

  const openSub = () => {
    if (!item.submenu) return;
    const r = rowRef.current?.getBoundingClientRect();
    setSubLeft(!!r && r.right + 200 > window.innerWidth);
    setSubOpen(true);
  };

  return (
    <div
      ref={rowRef}
      className="relative"
      onMouseEnter={openSub}
      onMouseLeave={() => setSubOpen(false)}
    >
      <button
        type="button"
        disabled={item.disabled}
        className={`flex h-[26px] w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[12px] transition-colors disabled:cursor-default disabled:opacity-40 ${
          item.danger
            ? 'text-danger hover:bg-danger/15'
            : 'text-fg-dim not-disabled:hover:bg-hover not-disabled:hover:text-fg'
        }`}
        onClick={() => {
          if (item.submenu) return;
          onDone();
          item.onClick?.();
        }}
      >
        {hasChecks && (
          <span className="flex w-3.5 shrink-0 justify-center">
            {item.checked && <Check size={12} className="text-accent" />}
          </span>
        )}
        {item.icon && <span className="flex w-4 shrink-0 justify-center">{item.icon}</span>}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.submenu && <ChevronRight size={12} className="shrink-0 text-fg-faint" />}
      </button>
      {item.submenu && subOpen && (
        <div
          className={`absolute top-[-5px] z-10 ${subLeft ? 'right-full' : 'left-full'}`}
        >
          <MenuPanel items={item.submenu} onDone={onDone} clampSelf />
        </div>
      )}
    </div>
  );
}

function MenuPanel({
  items,
  onDone,
  clampSelf = false,
}: {
  items: MenuEntry[];
  onDone: () => void;
  clampSelf?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // keep submenus on screen vertically
  useLayoutEffect(() => {
    const el = ref.current;
    if (!clampSelf || !el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 8) {
      el.style.transform = `translateY(${window.innerHeight - 8 - r.bottom}px)`;
    }
  }, [clampSelf]);

  const hasChecks = items.some((i) => i !== 'separator' && i.checked !== undefined);
  return (
    <div ref={ref} className={PANEL_CLASS}>
      {items.map((entry, i) =>
        entry === 'separator' ? (
          <div key={`sep-${i}`} className="my-1 h-px bg-white/8" />
        ) : (
          <ItemRow key={`${entry.label}-${i}`} item={entry} hasChecks={hasChecks} onDone={onDone} />
        ),
      )}
    </div>
  );
}

/** Portal host for the shared context menu — mount once in App. */
export function ContextMenuHost() {
  const menu = useContextMenuStore((s) => s.menu);
  const close = useContextMenuStore((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);

  // clamp to the viewport once measured, then reveal (DOM-only, no re-render)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!menu || !el) return;
    const r = el.getBoundingClientRect();
    el.style.left = `${Math.max(4, Math.min(menu.x, window.innerWidth - r.width - 8))}px`;
    el.style.top = `${Math.max(4, Math.min(menu.y, window.innerHeight - r.height - 8))}px`;
    el.style.visibility = 'visible';
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('blur', close);
    };
  }, [menu, close]);

  if (!menu) return null;
  return createPortal(
    <div
      ref={ref}
      className="fixed z-[70]"
      style={{ left: menu.x, top: menu.y, visibility: 'hidden' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuPanel items={menu.items} onDone={close} />
    </div>,
    document.body,
  );
}
