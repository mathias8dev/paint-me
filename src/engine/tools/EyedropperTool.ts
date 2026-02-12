import { BaseTool } from './BaseTool';
import { ToolType } from '../types';
import type { PointerEventData } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';
import type { LayerCompositor } from '../layers';

export type ColorPickCallback = (color: string) => void;

export class EyedropperTool extends BaseTool {
  private onColorPick: ColorPickCallback | null = null;
  private compositor: LayerCompositor | null = null;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Eyedropper, 'Eyedropper', 'i', layerManager, commandHistory, viewport);
  }

  setCompositor(compositor: LayerCompositor): void {
    this.compositor = compositor;
  }

  setColorPickCallback(cb: ColorPickCallback): void {
    this.onColorPick = cb;
  }

  getCursor(): string {
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    this.pickColor(event);
  }

  onPointerMove(event: PointerEventData): void {
    // Live preview while dragging
    this.pickColor(event);
  }

  onPointerUp(_event: PointerEventData): void {}

  private pickColor(event: PointerEventData): void {
    if (!this.compositor) return;

    const layers = this.layerManager.getAllLayers();
    const composited = this.compositor.composite(layers);
    const ctx = composited.getContext('2d')!;

    const x = Math.round(event.point.x);
    const y = Math.round(event.point.y);

    if (x < 0 || y < 0 || x >= composited.width || y >= composited.height) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;

    this.onColorPick?.(hex);
  }
}
