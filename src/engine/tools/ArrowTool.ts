import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class ArrowTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Arrow, 'Arrow', 'a', layerManager, commandHistory, viewport);
  }

  protected drawShape(
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
