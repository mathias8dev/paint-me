import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class PolygonTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Polygon, 'Polygon', 'o', layerManager, commandHistory, viewport);
  }

  protected drawShape(
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
