import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands';
import { ToolType } from '../types';
import type { PointerEventData } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

export class FillTool extends BaseTool {
  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Fill, 'Fill', 'g', layerManager, commandHistory, viewport);
  }

  getCursor(): string {
    return 'crosshair';
  }

  onPointerDown(event: PointerEventData): void {
    const layer = this.layerManager.getActiveLayer();
    if (layer.locked) return;

    const x = Math.round(event.point.x);
    const y = Math.round(event.point.y);
    if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return;

    const beforeSnapshot = layer.getImageData();
    const imageData = layer.getImageData();

    const fillColor = this.hexToRgba(
      event.button === 2 ? this.config.fillColor : this.config.strokeColor,
      this.config.opacity,
    );
    const targetColor = this.getPixel(imageData, x, y);

    if (this.colorsMatch(targetColor, fillColor)) return;

    this.floodFill(imageData, x, y, targetColor, fillColor);
    layer.putImageData(imageData);

    const afterSnapshot = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, beforeSnapshot, afterSnapshot, this.layerManager, 'Fill'),
    );
  }

  onPointerMove(_event: PointerEventData): void {}
  onPointerUp(_event: PointerEventData): void {}

  private floodFill(
    imageData: ImageData,
    startX: number,
    startY: number,
    targetColor: [number, number, number, number],
    fillColor: [number, number, number, number],
  ): void {
    const { width, height, data } = imageData;
    const tolerance = 10;
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pixel = this.getPixel(imageData, x, y);
      if (!this.colorsClose(pixel, targetColor, tolerance)) continue;

      const offset = idx * 4;
      data[offset] = fillColor[0];
      data[offset + 1] = fillColor[1];
      data[offset + 2] = fillColor[2];
      data[offset + 3] = fillColor[3];

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  private getPixel(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    const offset = (y * imageData.width + x) * 4;
    return [
      imageData.data[offset],
      imageData.data[offset + 1],
      imageData.data[offset + 2],
      imageData.data[offset + 3],
    ];
  }

  private colorsMatch(
    a: [number, number, number, number],
    b: [number, number, number, number],
  ): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  private colorsClose(
    a: [number, number, number, number],
    b: [number, number, number, number],
    tolerance: number,
  ): boolean {
    return (
      Math.abs(a[0] - b[0]) <= tolerance &&
      Math.abs(a[1] - b[1]) <= tolerance &&
      Math.abs(a[2] - b[2]) <= tolerance &&
      Math.abs(a[3] - b[3]) <= tolerance
    );
  }

  private hexToRgba(hex: string, opacity: number): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, Math.round(opacity * 255)];
  }
}
