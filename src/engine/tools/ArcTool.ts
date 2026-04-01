import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class ArcTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Arc, 'Arc', 'd', layerManager, commandHistory, viewport);
  }

  protected drawShape(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    center: Point,
    edge: Point,
  ): void {
    const dx = edge.x - center.x;
    const dy = edge.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const startAngle = Math.atan2(dy, dx);
    const sweepRad = (this.config.arcSweepAngle * Math.PI) / 180;

    if (radius < 2) return;

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.beginPath();

    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, startAngle, startAngle + sweepRad);
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
