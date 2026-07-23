import { useToastStore, type ToastKind } from '../../store/toast';
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from './icons/general';

const appearance: Record<
  ToastKind,
  { icon: React.ReactNode; badge: string; border: string; bar: string }
> = {
  error: {
    icon: <AlertIcon size={13} className="text-danger" />,
    badge: 'bg-danger/12',
    border: 'border-danger/20',
    bar: 'bg-danger',
  },
  ok: {
    icon: <CheckIcon size={13} className="text-ok" />,
    badge: 'bg-ok/12',
    border: 'border-ok/20',
    bar: 'bg-ok',
  },
  info: {
    icon: <InfoIcon size={13} className="text-accent" />,
    badge: 'bg-accent/12',
    border: 'border-accent/20',
    bar: 'bg-accent',
  },
};

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-[80] flex w-[min(340px,calc(100vw-24px))] flex-col gap-2">
      {toasts.map((t) => {
        const style = appearance[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
            className={`${t.leaving ? 'toast-exit' : 'toast-enter'} ${style.border} pointer-events-auto relative flex min-h-11 items-center gap-2.5 overflow-hidden rounded-xl border bg-menu/95 px-2.5 py-2 text-[13px] text-fg shadow-modal backdrop-blur-md`}
          >
            <span
              className={`${style.badge} flex h-6 w-6 shrink-0 items-center justify-center rounded-lg`}
            >
              {style.icon}
            </span>
            <span className="min-w-0 flex-1 break-words leading-[18px]">
              {t.message}
            </span>
            <button
              type="button"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-faint transition-colors hover:bg-white/8 hover:text-fg"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <CloseIcon size={11} />
            </button>
            <span
              aria-hidden="true"
              className={`toast-timer absolute inset-x-0 bottom-0 h-0.5 opacity-70 ${style.bar}`}
            />
          </div>
        );
      })}
    </div>
  );
}
