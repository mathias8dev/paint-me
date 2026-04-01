import { BaseShapeTool } from './BaseShapeTool';
import { ToolType } from '../types';
import type { Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class CircleTool extends BaseShapeTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Circle, 'Circle', 'c', layerManager, commandHistory, viewport);
  }

  protected drawShape(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    start: Point,
    end: Point,
    shiftKey: boolean,
  ): void {
    let w = end.x - start.x;
    let h = end.y - start.y;

    if (shiftKey) {
      const side = Math.min(Math.abs(w), Math.abs(h));
      w = Math.sign(w) * side;
      h = Math.sign(h) * side;
    }

    const cx = start.x + w / 2;
    const cy = start.y + h / 2;
    const rx = Math.abs(w) / 2;
    const ry = Math.abs(h) / 2;

    if (rx === 0 || ry === 0) return;

    ctx.save();
    ctx.globalAlpha = this.config.opacity;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (this.config.fillEnabled) {
      ctx.fillStyle = this.config.fillColor;
      ctx.fill();
    }

    if (this.config.strokeEnabled) {
      ctx.strokeStyle = this.config.strokeColor;
      ctx.lineWidth = this.config.strokeWidth;
      ctx.stroke();
    }

    ctx.restore();
  }
}
