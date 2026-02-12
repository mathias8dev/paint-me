import type { HexColor } from './color';

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: HexColor;
  maxHistorySize: number;
}

export interface RenderOptions {
  showGrid: boolean;
  gridThreshold: number;
  antialias: boolean;
}

export function createDefaultCanvasConfig(): CanvasConfig {
  return {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    maxHistorySize: 50,
  };
}
