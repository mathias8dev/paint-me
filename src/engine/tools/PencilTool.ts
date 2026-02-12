import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class PencilTool extends BaseTool {
  private isDrawing = false;
  private lastPoint: Point | null = null;
  private snapshotBeforeStroke: ImageData | null = null;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Pencil, 'Pencil', 'p', layerManager, commandHistory, viewport);
  }

  getCursor(): string {
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    const layer = this.layerManager.getActiveLayer();
    if (layer.locked) return;

    this.isDrawing = true;
    this.lastPoint = event.point;

    this.snapshotBeforeStroke = layer.getImageData();

    const ctx = layer.getContext();
    ctx.save();
    ctx.beginPath();
    ctx.arc(event.point.x, event.point.y, this.config.strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = event.button === 2 ? this.config.fillColor : this.config.strokeColor;
    ctx.globalAlpha = this.config.opacity;
    ctx.fill();
    ctx.restore();
  }

  onPointerMove(event: PointerEventData): void {
    if (!this.isDrawing || !this.lastPoint) return;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    ctx.lineTo(event.point.x, event.point.y);
    ctx.strokeStyle = event.button === 2 ? this.config.fillColor : this.config.strokeColor;
    ctx.lineWidth = this.config.strokeWidth;
    ctx.lineCap = this.config.lineCap;
    ctx.lineJoin = this.config.lineJoin;
    ctx.globalAlpha = this.config.opacity;
    ctx.stroke();
    ctx.restore();

    this.lastPoint = event.point;
  }

  onPointerUp(_event: PointerEventData): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const layer = this.layerManager.getActiveLayer();
    const snapshotAfter = layer.getImageData();
    const command = new DrawCommand(
      layer.id,
      this.snapshotBeforeStroke!,
      snapshotAfter,
      this.layerManager,
      'Pencil stroke',
    );
    this.commandHistory.push(command);

    this.lastPoint = null;
    this.snapshotBeforeStroke = null;
  }
}
