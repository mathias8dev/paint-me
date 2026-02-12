import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class ArrowTool extends BaseTool {
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
    super(ToolType.Arrow, 'Arrow', 'a', layerManager, commandHistory, viewport);
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
    this.drawArrow(this.previewCtx, this.startPoint, event.point);
  }

  onPointerUp(event: PointerEventData): void {
    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();
    this.drawArrow(ctx, this.startPoint, event.point);

    const snapshotAfter = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, this.snapshotBeforeStroke!, snapshotAfter, this.layerManager, 'Arrow'),
    );

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.startPoint = null;
    this.snapshotBeforeStroke = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.isDrawing ? this.previewCanvas : null;
  }

  private drawArrow(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ): void {
    const headSize = this.config.arrowHeadSize;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.strokeStyle = this.config.strokeColor;
    ctx.fillStyle = this.config.strokeColor;
    ctx.lineWidth = this.config.strokeWidth;
    ctx.lineCap = this.config.lineCap;

    // Line
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headSize * Math.cos(angle - Math.PI / 6),
      to.y - headSize * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      to.x - headSize * Math.cos(angle + Math.PI / 6),
      to.y - headSize * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
