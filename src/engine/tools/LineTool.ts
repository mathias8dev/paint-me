import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class LineTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Line, 'Line', 'l', layerManager, commandHistory, viewport);
  }

  protected drawShape(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    from: Point,
    to: Point,
    shiftKey: boolean,
  ): void {
    const end = shiftKey ? this.constrainToAngle(from, to) : to;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = this.config.strokeColor;
    ctx.lineWidth = this.config.strokeWidth;
    ctx.lineCap = this.config.lineCap;
    ctx.globalAlpha = this.config.opacity;
    ctx.stroke();
    ctx.restore();
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
