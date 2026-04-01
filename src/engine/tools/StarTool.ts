import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class StarTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Star, 'Star', 'x', layerManager, commandHistory, viewport);
  }

  protected drawShape(
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
