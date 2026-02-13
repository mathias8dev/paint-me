import type { HexColor } from './color';
import type { Point } from './geometry';

export const ToolType = {
  Pencil: 'pencil',
  Eraser: 'eraser',
  Line: 'line',
  Rectangle: 'rectangle',
  Circle: 'circle',
  Fill: 'fill',
  Text: 'text',
  Selection: 'selection',
  Eyedropper: 'eyedropper',
  Spray: 'spray',
  Polygon: 'polygon',
  Arrow: 'arrow',
  RoundedRectangle: 'rounded-rectangle',
  Star: 'star',
  Triangle: 'triangle',
  Arc: 'arc',
  Paste: 'paste',
} as const;

export type ToolType = (typeof ToolType)[keyof typeof ToolType];

export interface ToolConfig {
  strokeWidth: number;
  strokeColor: HexColor;
  fillColor: HexColor;
  opacity: number;
  fillEnabled: boolean;
  strokeEnabled: boolean;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  fontSize: number;
  fontFamily: string;
  sprayRadius: number;
  sprayDensity: number;
  polygonSides: number;
  arrowHeadSize: number;
  cornerRadius: number;
  starPoints: number;
  starInnerRatio: number;
  arcSweepAngle: number;
}

export interface PointerEventData {
  point: Point;
  pressure: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export function createDefaultToolConfig(): ToolConfig {
  return {
    strokeWidth: 3,
    strokeColor: '#000000',
    fillColor: '#000000',
    opacity: 1,
    fillEnabled: false,
    strokeEnabled: true,
    lineCap: 'round',
    lineJoin: 'round',
    fontSize: 16,
    fontFamily: 'Arial',
    sprayRadius: 20,
    sprayDensity: 30,
    polygonSides: 5,
    arrowHeadSize: 15,
    cornerRadius: 20,
    starPoints: 5,
    starInnerRatio: 0.4,
    arcSweepAngle: 270,
  };
}
