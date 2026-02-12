import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class CircleTool extends BaseTool {
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
    super(ToolType.Circle, 'Circle', 'c', layerManager, commandHistory, viewport);
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
    this.drawEllipse(this.previewCtx, this.startPoint, event.point, event.shiftKey);
  }

  onPointerUp(event: PointerEventData): void {
    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();
    this.drawEllipse(ctx, this.startPoint, event.point, event.shiftKey);

    const snapshotAfter = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, this.snapshotBeforeStroke!, snapshotAfter, this.layerManager, 'Circle'),
    );

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.startPoint = null;
    this.snapshotBeforeStroke = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.isDrawing ? this.previewCanvas : null;
  }

  private drawEllipse(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    start: Point,
    end: Point,
    circle: boolean,
  ): void {
    let w = end.x - start.x;
    let h = end.y - start.y;

    if (circle) {
      const side = Math.min(Math.abs(w), Math.abs(h));
      w = Math.sign(w) * side;
      h = Math.sign(h) * side;
    }

    const cx = start.x + w / 2;
    const cy = start.y + h / 2;
    const rx = Math.abs(w) / 2;
    const ry = Math.abs(h) / 2;

    if (rx === 0 || ry === 0) return;

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (this.config.fillEnabled) {
      ctx.fillStyle = this.config.fillColor;
      ctx.fill();
    }

    if (this.config.strokeEnabled) {
      ctx.strokeStyle = this.config.strokeColor;
      ctx.lineWidth = this.config.strokeWidth;
      ctx.stroke();
    }

    ctx.restore();
  }
}
