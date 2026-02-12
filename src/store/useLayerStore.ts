import { create } from 'zustand';
import type { LayerData } from '@/engine/types';

interface LayerState {
  layers: LayerData[];
  activeLayerId: string;

  setLayers: (layers: LayerData[]) => void;
  setActiveLayerId: (id: string) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  activeLayerId: '',

  setLayers: (layers) => set({ layers }),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
}));
