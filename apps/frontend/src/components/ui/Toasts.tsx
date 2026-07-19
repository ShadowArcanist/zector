import { Check, CircleAlert, Info, X } from 'lucide-react';
import { useToastStore, type ToastKind } from '../../store/toast';

const iconFor: Record<ToastKind, React.ReactNode> = {
  error: <CircleAlert size={14} className="shrink-0 text-danger" />,
  ok: <Check size={14} className="shrink-0 text-ok" />,
  info: <Info size={14} className="shrink-0 text-accent" />,
};

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-2 rounded-md border border-edge2 bg-bg2 px-3 py-2 text-[13px] text-fg shadow-lg shadow-black/50"
        >
          {iconFor[t.kind]}
          <span className="min-w-0 flex-1 break-words">{t.message}</span>
          <button
            type="button"
            className="cursor-pointer text-fg-faint hover:text-fg"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
