import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './icons/general';
import { IconButton } from './Button';

type Props = {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string; // tailwind width class
  surface?: string; // tailwind bg class (bg-menu for menu-like pickers)
};

/** iOS-style dialog shell: large radius, soft shadow, hairline border. */
export function Modal({ title, onClose, children, width = 'w-[440px]', surface = 'bg-bg1' }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${width} ${surface} flex max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[20px] border border-white/6 shadow-modal`}
        role="dialog"
        aria-modal="true"
      >
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-3">
            <span className="text-[16px] font-semibold text-fg">{title}</span>
            <IconButton onClick={onClose} aria-label="Close">
              <CloseIcon size={15} />
            </IconButton>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
