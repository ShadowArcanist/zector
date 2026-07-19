import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

type Props = {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string; // tailwind width class
};

export function Modal({ title, onClose, children, width = 'w-[440px]' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${width} max-h-[76vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-edge2 bg-bg1 shadow-modal`}
        role="dialog"
        aria-modal="true"
      >
        {title !== undefined && (
          <div className="flex h-10 items-center justify-between border-b border-white/8 px-3.5">
            <span className="text-[13px] font-semibold text-fg">{title}</span>
            <IconButton onClick={onClose} aria-label="Close">
              <X size={14} />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
