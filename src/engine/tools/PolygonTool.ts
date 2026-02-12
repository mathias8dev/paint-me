import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class PolygonTool extends BaseTool {
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
    super(ToolType.Polygon, 'Polygon', 'o', layerManager, commandHistory, viewport);
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
    this.drawPolygon(this.previewCtx, this.startPoint, event.point);
  }

  onPointerUp(event: PointerEventData): void {
    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();
    this.drawPolygon(ctx, this.startPoint, event.point);

    const snapshotAfter = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, this.snapshotBeforeStroke!, snapshotAfter, this.layerManager, 'Polygon'),
    );

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.startPoint = null;
    this.snapshotBeforeStroke = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.isDrawing ? this.previewCanvas : null;
  }

  private drawPolygon(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    center: Point,
    edge: Point,
  ): void {
    const sides = this.config.polygonSides;
    const dx = edge.x - center.x;
    const dy = edge.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const startAngle = Math.atan2(dy, dx);

    if (radius < 2) return;

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.beginPath();

    for (let i = 0; i <= sides; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / sides;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();

    if (this.config.fillEnabled) {
      ctx.fillStyle = this.config.fillColor;
      ctx.fill();
    }

    if (this.config.strokeEnabled) {
      ctx.strokeStyle = this.config.strokeColor;
      ctx.lineWidth = this.config.strokeWidth;
      ctx.lineJoin = this.config.lineJoin;
      ctx.stroke();
    }

    ctx.restore();
  }
}
