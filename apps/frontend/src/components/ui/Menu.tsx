import { useEffect, useRef, useState, type ReactNode } from 'react';

export type MenuItemDef = {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
};

type Props = {
  x: number;
  y: number;
  items: MenuItemDef[];
  onClose: () => void;
};

/** Context menu positioned at viewport coords, clamped to the window. */
export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({
        left: Math.min(x, window.innerWidth - r.width - 8),
        top: Math.min(y, window.innerHeight - r.height - 8),
      });
    }
  }, [x, y]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onClose);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={pos}
      className="fixed z-50 min-w-40 rounded-md border border-edge2 bg-bg2 py-1 shadow-xl shadow-black/50"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
            item.danger ? 'text-danger hover:bg-danger/15' : 'text-fg-dim hover:bg-bg3 hover:text-fg'
          }`}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
