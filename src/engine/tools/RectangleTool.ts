import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class RectangleTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Rectangle, 'Rectangle', 'r', layerManager, commandHistory, viewport);
  }

  protected drawShape(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    start: Point,
    end: Point,
    shiftKey: boolean,
  ): void {
    const rect = this.getRect(start, end, shiftKey);

    ctx.save();
    ctx.globalAlpha = this.config.opacity;

    if (this.config.fillEnabled) {
      ctx.fillStyle = this.config.fillColor;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    if (this.config.strokeEnabled) {
      ctx.strokeStyle = this.config.strokeColor;
      ctx.lineWidth = this.config.strokeWidth;
      ctx.lineJoin = this.config.lineJoin;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
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
