import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export type TextToolCallback = (point: Point, onConfirm: (text: string) => void) => void;

export class TextTool extends BaseTool {
  private onTextRequest: TextToolCallback | null = null;

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Text, 'Text', 't', layerManager, commandHistory, viewport);
  }

  setTextCallback(cb: TextToolCallback): void {
    this.onTextRequest = cb;
  }

  getCursor(): string {
    return 'text';
  }

  onPointerDown(event: PointerEventData): void {
    const layer = this.layerManager.getActiveLayer();
    if (layer.locked) return;

    if (this.onTextRequest) {
      this.onTextRequest(event.point, (text: string) => {
        this.drawText(event.point, text);
      });
    }
  }

  onPointerMove(_event: PointerEventData): void {}
  onPointerUp(_event: PointerEventData): void {}

  private drawText(point: Point, text: string): void {
    if (!text.trim()) return;

    const layer = this.layerManager.getActiveLayer();
    const beforeSnapshot = layer.getImageData();
    const ctx = layer.getContext();

    ctx.save();
    ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
    ctx.fillStyle = this.config.strokeColor;
    ctx.globalAlpha = this.config.opacity;
    ctx.textBaseline = 'top';
    ctx.fillText(text, point.x, point.y);
    ctx.restore();

    const afterSnapshot = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, beforeSnapshot, afterSnapshot, this.layerManager, 'Text'),
    );
  }
}
