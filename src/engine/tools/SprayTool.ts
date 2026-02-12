import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class SprayTool extends BaseTool {
  private isDrawing = false;
  private currentPoint: Point | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private snapshotBeforeStroke: ImageData | null = null;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Spray, 'Spray', 'y', layerManager, commandHistory, viewport);
  }

  getCursor(): string {
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    const layer = this.layerManager.getActiveLayer();
    if (layer.locked) return;

    this.isDrawing = true;
    this.currentPoint = event.point;
    this.snapshotBeforeStroke = layer.getImageData();

    this.spray();
    this.intervalId = setInterval(() => this.spray(), 30);
  }

  onPointerMove(event: PointerEventData): void {
    if (!this.isDrawing) return;
    this.currentPoint = event.point;
  }

  onPointerUp(_event: PointerEventData): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const layer = this.layerManager.getActiveLayer();
    const snapshotAfter = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, this.snapshotBeforeStroke!, snapshotAfter, this.layerManager, 'Spray'),
    );

    this.currentPoint = null;
    this.snapshotBeforeStroke = null;
  }

  onDeactivate(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private spray(): void {
    if (!this.currentPoint) return;

    const layer = this.layerManager.getActiveLayer();
    const ctx = layer.getContext();
    const radius = this.config.sprayRadius;
    const density = this.config.sprayDensity;

    ctx.save();
    ctx.fillStyle = this.config.strokeColor;
    ctx.globalAlpha = this.config.opacity;

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = this.currentPoint.x + Math.cos(angle) * r;
      const y = this.currentPoint.y + Math.sin(angle) * r;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.restore();
  }
}
