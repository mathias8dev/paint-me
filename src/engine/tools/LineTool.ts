import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';
import { ShapePlacement, getContentBounds } from './ShapePlacement';

export class LineTool extends BaseTool {
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
    super(ToolType.Line, 'Line', 'l', layerManager, commandHistory, viewport);
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

    let endPoint = event.point;
    if (event.shiftKey) {
      endPoint = this.constrainToAngle(this.startPoint, event.point);
    }

    this.drawLine(this.previewCtx, this.startPoint, endPoint);
  }

  onPointerUp(event: PointerEventData): void {
    if (this.placement.active) {
      this.placement.onPointerUp();
      return;
    }

    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    let endPoint = event.point;
    if (event.shiftKey) {
      endPoint = this.constrainToAngle(this.startPoint, event.point);
    }

    this.drawLine(this.previewCtx, this.startPoint, endPoint);

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
        new DrawCommand(layer.id, before, after, this.layerManager, 'Line'),
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

  private drawLine(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = this.config.strokeColor;
    ctx.lineWidth = this.config.strokeWidth;
    ctx.lineCap = this.config.lineCap;
    ctx.globalAlpha = this.config.opacity;
    ctx.stroke();
    ctx.restore();
  }

  private constrainToAngle(start: Point, end: Point): Point {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return {
      x: start.x + Math.cos(snapped) * dist,
      y: start.y + Math.sin(snapped) * dist,
    };
  }
}
