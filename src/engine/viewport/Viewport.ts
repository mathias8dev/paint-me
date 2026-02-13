import type { Point, Size } from '../types';

export class Viewport {
  private _zoom = 1;
  private _offset: Point = { x: 0, y: 0 };
  private _canvasSize: Size;

  constructor(canvasSize: Size) {
    this._canvasSize = { ...canvasSize };
  }

  get zoom(): number {
    return this._zoom;
  }

  get offset(): Point {
    return { ...this._offset };
  }

  get canvasSize(): Size {
    return { ...this._canvasSize };
  }

  setCanvasSize(size: Size): void {
    this._canvasSize = { ...size };
  }

  setZoom(zoom: number, focalPoint?: Point): void {
    const clamped = Math.max(0.1, Math.min(32, zoom));
    if (focalPoint) {
      const canvasPoint = this.screenToCanvas(focalPoint);
      this._zoom = clamped;
      this._offset = {
        x: focalPoint.x - canvasPoint.x * this._zoom,
        y: focalPoint.y - canvasPoint.y * this._zoom,
      };
    } else {
      this._zoom = clamped;
    }
  }

  screenToCanvas(screenPoint: Point): Point {
    return {
      x: (screenPoint.x - this._offset.x) / this._zoom,
      y: (screenPoint.y - this._offset.y) / this._zoom,
    };
  }

  canvasToScreen(canvasPoint: Point): Point {
    return {
      x: canvasPoint.x * this._zoom + this._offset.x,
      y: canvasPoint.y * this._zoom + this._offset.y,
    };
  }

  setOffset(offset: Point): void {
    this._offset = { ...offset };
  }

  pan(deltaX: number, deltaY: number): void {
    this._offset.x += deltaX;
    this._offset.y += deltaY;
  }

  fitToContainer(containerSize: Size): void {
    const scaleX = containerSize.width / this._canvasSize.width;
    const scaleY = containerSize.height / this._canvasSize.height;
    this._zoom = Math.min(scaleX, scaleY) * 0.9;
    this._offset = {
      x: (containerSize.width - this._canvasSize.width * this._zoom) / 2,
      y: (containerSize.height - this._canvasSize.height * this._zoom) / 2,
    };
  }

  resetZoom(): void {
    this._zoom = 1;
    this._offset = { x: 0, y: 0 };
  }

  centerInContainer(containerSize: Size): void {
    this._offset = {
      x: (containerSize.width - this._canvasSize.width * this._zoom) / 2,
      y: (containerSize.height - this._canvasSize.height * this._zoom) / 2,
    };
  }
}
