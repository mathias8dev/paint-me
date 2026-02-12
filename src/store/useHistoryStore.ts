import { create } from 'zustand';

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;

  sync: (canUndo: boolean, canRedo: boolean, undoCount: number, redoCount: number) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,

  sync: (canUndo, canRedo, undoCount, redoCount) =>
    set({ canUndo, canRedo, undoCount, redoCount }),
}));
