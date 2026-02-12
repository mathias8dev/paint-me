import { BaseTool } from './BaseTool';
import { ToolType } from '../types';
import type { PointerEventData, Point, Rect } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export type SelectionCallback = (rect: Rect | null) => void;

export class SelectionTool extends BaseTool {
  private isSelecting = false;
  private startPoint: Point | null = null;
  private previewCanvas: OffscreenCanvas;
  private previewCtx: OffscreenCanvasRenderingContext2D;
  private onSelectionChange: SelectionCallback | null = null;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Selection, 'Selection', 's', layerManager, commandHistory, viewport);
    const layer = layerManager.getActiveLayer();
    this.previewCanvas = new OffscreenCanvas(layer.width, layer.height);
    this.previewCtx = this.previewCanvas.getContext('2d')!;
  }

  setSelectionCallback(cb: SelectionCallback): void {
    this.onSelectionChange = cb;
  }

  getCursor(): string {
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    this.isSelecting = true;
    this.startPoint = event.point;
    this.previewCanvas.width = this.layerManager.getActiveLayer().width;
    this.previewCanvas.height = this.layerManager.getActiveLayer().height;
  }

  onPointerMove(event: PointerEventData): void {
    if (!this.isSelecting || !this.startPoint) return;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    const rect = this.getRect(this.startPoint, event.point);

    // Draw dashed selection rect
    this.previewCtx.save();
    this.previewCtx.strokeStyle = '#000000';
    this.previewCtx.lineWidth = 1;
    this.previewCtx.setLineDash([5, 5]);
    this.previewCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    this.previewCtx.strokeStyle = '#ffffff';
    this.previewCtx.lineDashOffset = 5;
    this.previewCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    this.previewCtx.restore();
  }

  onPointerUp(event: PointerEventData): void {
    if (!this.isSelecting || !this.startPoint) return;
    this.isSelecting = false;

    const rect = this.getRect(this.startPoint, event.point);
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    if (rect.width > 2 && rect.height > 2) {
      this.onSelectionChange?.(rect);
    } else {
      this.onSelectionChange?.(null);
    }

    this.startPoint = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.isSelecting ? this.previewCanvas : null;
  }

  private getRect(start: Point, end: Point): Rect {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    return {
      x,
      y,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }
}
