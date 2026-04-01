import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class TriangleTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Triangle, 'Triangle', 'w', layerManager, commandHistory, viewport);
  }

  protected drawShape(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    start: Point,
    end: Point,
    shiftKey: boolean,
  ): void {
    const rect = this.getRect(start, end, shiftKey);
    if (rect.w < 1 || rect.h < 1) return;

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.beginPath();

    ctx.moveTo(rect.x + rect.w / 2, rect.y);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
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

  private getRect(start: Point, end: Point, square: boolean) {
    let w = end.x - start.x;
    let h = end.y - start.y;

    if (square) {
      const side = Math.min(Math.abs(w), Math.abs(h));
      w = Math.sign(w) * side;
      h = Math.sign(h) * side;
    }

    return {
      x: w >= 0 ? start.x : start.x + w,
      y: h >= 0 ? start.y : start.y + h,
      w: Math.abs(w),
      h: Math.abs(h),
    };
  }
}
