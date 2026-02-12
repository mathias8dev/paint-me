import { create } from 'zustand';
import type { Point, HexColor } from '@/engine/types';

interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  panOffset: Point;
  backgroundColor: HexColor;
  cursorPosition: Point | null;

  setDimensions: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Point) => void;
  setCursorPosition: (point: Point | null) => void;
  setBackgroundColor: (color: HexColor) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  width: 800,
  height: 600,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  backgroundColor: '#ffffff',
  cursorPosition: null,

  setDimensions: (width, height) => set({ width, height }),
  setZoom: (zoom) => set({ zoom }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setCursorPosition: (point) => set({ cursorPosition: point }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
}));
