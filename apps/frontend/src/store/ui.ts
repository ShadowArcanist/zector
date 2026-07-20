import { create } from 'zustand';

/** Where a newly-picked block should land. */
export type PickerRequest =
  | { mode: 'split'; leafId: string; dir: 'row' | 'col' }
  | { mode: 'root'; tabId: string };

type UiStore = {
  picker: PickerRequest | null;
  openPicker: (req: PickerRequest) => void;
  closePicker: () => void;
  connectionsOpen: boolean;
  /** id of connection being edited, 'new' for the create form, null = list view */
  connectionsView: string | null;
  openConnections: (view?: string | null) => void;
  closeConnections: () => void;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  picker: null,
  openPicker: (req) => set({ picker: req }),
  closePicker: () => set({ picker: null }),
  connectionsOpen: false,
  connectionsView: null,
  openConnections: (view = null) => set({ connectionsOpen: true, connectionsView: view }),
  closeConnections: () => set({ connectionsOpen: false, connectionsView: null }),
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
}));
