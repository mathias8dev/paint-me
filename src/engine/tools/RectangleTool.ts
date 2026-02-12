import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class RectangleTool extends BaseTool {
  private isDrawing = false;
  private startPoint: Point | null = null;
  private snapshotBeforeStroke: ImageData | null = null;
  private previewCanvas: OffscreenCanvas;
  private previewCtx: OffscreenCanvasRenderingContext2D;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Rectangle, 'Rectangle', 'r', layerManager, commandHistory, viewport);
    const layer = layerManager.getActiveLayer();
    this.previewCanvas = new OffscreenCanvas(layer.width, layer.height);
    this.previewCtx = this.previewCanvas.getContext('2d')!;
  }

  getCursor(): string {
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    const layer = this.layerManager.getActiveLayer();
    if (layer.locked) return;

    this.isDrawing = true;
    this.startPoint = event.point;
    this.snapshotBeforeStroke = layer.getImageData();

    this.previewCanvas.width = layer.width;
    this.previewCanvas.height = layer.height;
  }

  onPointerMove(event: PointerEventData): void {
    if (!this.isDrawing || !this.startPoint) return;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    const rect = this.getRect(this.startPoint, event.point, event.shiftKey);
    this.drawRect(this.previewCtx, rect);
  }

  onPointerUp(event: PointerEventData): void {
    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();
    const rect = this.getRect(this.startPoint, event.point, event.shiftKey);
    this.drawRect(ctx, rect);

    const snapshotAfter = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, this.snapshotBeforeStroke!, snapshotAfter, this.layerManager, 'Rectangle'),
    );

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.startPoint = null;
    this.snapshotBeforeStroke = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.isDrawing ? this.previewCanvas : null;
  }

  private drawRect(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    rect: { x: number; y: number; w: number; h: number },
  ): void {
    ctx.save();
    ctx.globalAlpha = this.config.opacity;

    if (this.config.fillEnabled) {
      ctx.fillStyle = this.config.fillColor;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    if (this.config.strokeEnabled) {
      ctx.strokeStyle = this.config.strokeColor;
      ctx.lineWidth = this.config.strokeWidth;
      ctx.lineJoin = this.config.lineJoin;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    ctx.restore();
  }

  private getRect(start: Point, end: Point, square: boolean) {
    let w = end.x - start.x;
    let h = end.y - start.y;

    if (square) {
      const side = Math.min(Math.abs(w), Math.abs(h));
      w = Math.sign(w) * side;
      h = Math.sign(h) * side;
    }

    return {
      x: w >= 0 ? start.x : start.x + w,
      y: h >= 0 ? start.y : start.y + h,
      w: Math.abs(w),
      h: Math.abs(h),
    };
  }
}
