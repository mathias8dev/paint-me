import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';
import { ShapePlacement, getContentBounds } from './ShapePlacement';

export class StarTool extends BaseTool {
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
    super(ToolType.Star, 'Star', 'x', layerManager, commandHistory, viewport);
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
    this.drawStar(this.previewCtx, this.startPoint, event.point);
  }

  onPointerUp(event: PointerEventData): void {
    if (this.placement.active) {
      this.placement.onPointerUp();
      return;
    }

    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.drawStar(this.previewCtx, this.startPoint, event.point);

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
        new DrawCommand(layer.id, before, after, this.layerManager, 'Star'),
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

  private drawStar(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    center: Point,
    edge: Point,
  ): void {
    const points = this.config.starPoints;
    const innerRatio = this.config.starInnerRatio;
    const dx = edge.x - center.x;
    const dy = edge.y - center.y;
    const outerRadius = Math.sqrt(dx * dx + dy * dy);
    const innerRadius = outerRadius * innerRatio;
    const startAngle = Math.atan2(dy, dx);

    if (outerRadius < 2) return;

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.beginPath();

    const totalPoints = points * 2;
    for (let i = 0; i <= totalPoints; i++) {
      const angle = startAngle + (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
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
