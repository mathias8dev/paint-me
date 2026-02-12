import { create } from 'zustand';
import { ToolType, createDefaultToolConfig } from '@/engine/types';
import type { HexColor, ToolConfig } from '@/engine/types';

interface ToolState {
  activeTool: ToolType;
  primaryColor: HexColor;
  secondaryColor: HexColor;
  strokeWidth: number;
  opacity: number;
  fillEnabled: boolean;

  setActiveTool: (tool: ToolType) => void;
  setPrimaryColor: (color: HexColor) => void;
  setSecondaryColor: (color: HexColor) => void;
  swapColors: () => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setFillEnabled: (enabled: boolean) => void;
  getToolConfig: () => ToolConfig;
}

export const useToolStore = create<ToolState>((set, get) => ({
  activeTool: ToolType.Pencil,
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  strokeWidth: 3,
  opacity: 1,
  fillEnabled: false,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  swapColors: () =>
    set((state) => ({
      primaryColor: state.secondaryColor,
      secondaryColor: state.primaryColor,
    })),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setOpacity: (opacity) => set({ opacity }),
  setFillEnabled: (enabled) => set({ fillEnabled: enabled }),
  getToolConfig: () => {
    const state = get();
    return {
      ...createDefaultToolConfig(),
      strokeWidth: state.strokeWidth,
      strokeColor: state.primaryColor,
      fillColor: state.secondaryColor,
      opacity: state.opacity,
      fillEnabled: state.fillEnabled,
    };
  },
}));
