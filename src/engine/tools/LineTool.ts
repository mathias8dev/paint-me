import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class LineTool extends BaseTool {
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
    super(ToolType.Line, 'Line', 'l', layerManager, commandHistory, viewport);
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
    this.previewCtx.save();
    this.previewCtx.beginPath();
    this.previewCtx.moveTo(this.startPoint.x, this.startPoint.y);

    let endPoint = event.point;
    if (event.shiftKey) {
      endPoint = this.constrainToAngle(this.startPoint, event.point);
    }

    this.previewCtx.lineTo(endPoint.x, endPoint.y);
    this.previewCtx.strokeStyle = this.config.strokeColor;
    this.previewCtx.lineWidth = this.config.strokeWidth;
    this.previewCtx.lineCap = this.config.lineCap;
    this.previewCtx.globalAlpha = this.config.opacity;
    this.previewCtx.stroke();
    this.previewCtx.restore();
  }

  onPointerUp(event: PointerEventData): void {
    if (!this.isDrawing || !this.startPoint) return;
    this.isDrawing = false;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();

    let endPoint = event.point;
    if (event.shiftKey) {
      endPoint = this.constrainToAngle(this.startPoint, event.point);
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.startPoint.x, this.startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.strokeStyle = this.config.strokeColor;
    ctx.lineWidth = this.config.strokeWidth;
    ctx.lineCap = this.config.lineCap;
    ctx.globalAlpha = this.config.opacity;
    ctx.stroke();
    ctx.restore();

    const snapshotAfter = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, this.snapshotBeforeStroke!, snapshotAfter, this.layerManager, 'Line'),
    );

    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.startPoint = null;
    this.snapshotBeforeStroke = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.isDrawing ? this.previewCanvas : null;
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
