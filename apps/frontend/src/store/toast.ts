import { create } from 'zustand';

export type ToastKind = 'error' | 'ok' | 'info';
export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  leaving: boolean;
};

type ToastStore = {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;
export const TOAST_DURATION = 4500;
export const TOAST_EXIT_DURATION = 180;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = nextId++;
    set((s) => ({
      toasts: [...s.toasts.slice(-4), { id, kind, message, leaving: false }],
    }));
    setTimeout(() => get().dismiss(id), TOAST_DURATION);
  },
  dismiss: (id) => {
    const toast = get().toasts.find((item) => item.id === id);
    if (!toast || toast.leaving) return;
    set((s) => ({
      toasts: s.toasts.map((item) =>
        item.id === id ? { ...item, leaving: true } : item,
      ),
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((item) => item.id !== id) }));
    }, TOAST_EXIT_DURATION);
  },
}));

/** Convenience for non-component code. */
export function pushToast(kind: ToastKind, message: string) {
  useToastStore.getState().push(kind, message);
}
