import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';
import { ShapePlacement, getContentBounds } from './ShapePlacement';

export class CircleTool extends BaseTool {
  private isDrawing = false;
  private startPoint: Point | null = null;
  private snapshotBeforeStroke: ImageData | null = null;
  private previewCanvas: OffscreenCanvas;
  private previewCtx: OffscreenCanvasRenderingContext2D;
  private placement = new ShapePlacement();

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
    if (this.placement.active) return this.placement.getCursor();
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    if (this.placement.active) {
      const action = this.placement.onPointerDown(event.point);
      if (action === 'outside') this.confirmPlacement();
      return;
    }

    const layer = this.layerManager.getActiveLayer();
    if (layer.locked) return;

    this.isDrawing = true;
    this.startPoint = event.point;
    this.snapshotBeforeStroke = layer.getImageData();

    this.previewCanvas.width = layer.width;
    this.previewCanvas.height = layer.height;
  }

  onPointerMove(event: PointerEventData): void {
    if (this.placement.active) {
      this.placement.onPointerMove(event.point, event.shiftKey);
      return;
    }

    if (!this.isDrawing || !this.startPoint) return;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.drawEllipse(this.previewCtx, this.startPoint, event.point, event.shiftKey);
  }

  onPointerUp(event: PointerEventData): void {
    if (this.placement.active) {
      this.placement.onPointerUp();
      return;
    }

    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.drawEllipse(this.previewCtx, this.startPoint, event.point, event.shiftKey);

    this.enterPlacement();
    this.startPoint = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    if (this.placement.active) {
      const layer = this.layerManager.getActiveLayer();
      return this.placement.getPreviewCanvas(layer.width, layer.height);
    }
    return this.isDrawing ? this.previewCanvas : null;
  }

  onDeactivate(): void {
    if (this.placement.active) this.confirmPlacement();
  }

  hasPlacement(): boolean {
    return this.placement.active;
  }

  confirmPlacement(): void {
    if (!this.placement.active) return;

    const layer = this.layerManager.getActiveLayer();
    const before = this.snapshotBeforeStroke;
    this.placement.draw(layer.getContext());
    const after = layer.getImageData();
    if (before) {
      this.commandHistory.push(
        new DrawCommand(layer.id, before, after, this.layerManager, 'Circle'),
      );
    }
    this.placement.cleanup();
    this.snapshotBeforeStroke = null;
  }

  cancelPlacement(): void {
    this.placement.cleanup();
    this.snapshotBeforeStroke = null;
  }

  private enterPlacement(): void {
    const bounds = getContentBounds(this.previewCanvas);
    if (!bounds) {
      this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      this.snapshotBeforeStroke = null;
      return;
    }

    const source = new OffscreenCanvas(bounds.w, bounds.h);
    source.getContext('2d')!.drawImage(
      this.previewCanvas,
      bounds.x, bounds.y, bounds.w, bounds.h,
      0, 0, bounds.w, bounds.h,
    );
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.placement.start(source, bounds.x, bounds.y, bounds.w, bounds.h);
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
