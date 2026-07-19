import { create } from 'zustand';
import type { ReactNode } from 'react';

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  submenu?: MenuEntry[];
  onClick?: () => void;
};

/** Menu entries are items or the literal 'separator'. */
export type MenuEntry = MenuItem | 'separator';

type OpenMenu = { x: number; y: number; items: MenuEntry[] };

type ContextMenuStore = {
  menu: OpenMenu | null;
  open: (x: number, y: number, items: MenuEntry[]) => void;
  close: () => void;
};

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  menu: null,
  open: (x, y, items) => set({ menu: { x, y, items } }),
  close: () => set({ menu: null }),
}));

type MenuEvent = {
  preventDefault: () => void;
  stopPropagation: () => void;
  clientX: number;
  clientY: number;
};

/**
 * Open the shared custom context menu at the event position. Prevents the
 * native menu — call this only from handlers that own the right-click.
 */
export function openContextMenu(e: MenuEvent, items: MenuEntry[]) {
  e.preventDefault();
  e.stopPropagation();
  useContextMenuStore.getState().open(e.clientX, e.clientY, items);
}

export function closeContextMenu() {
  useContextMenuStore.getState().close();
}
