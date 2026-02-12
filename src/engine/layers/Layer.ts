import { v4 as uuidv4 } from 'uuid';
import type { BlendMode, LayerData, LayerSnapshot } from '../types';

export class Layer {
  readonly id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  order: number;

  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(width: number, height: number, name: string, id?: string) {
    this.id = id ?? uuidv4();
    this.name = name;
    this.visible = true;
    this.locked = false;
    this.opacity = 1;
    this.blendMode = 'source-over';
    this.order = 0;
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;
  }

  getContext(): OffscreenCanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): OffscreenCanvas {
    return this.canvas;
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  putImageData(data: ImageData): void {
    this.ctx.putImageData(data, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    const imageData = this.getImageData();
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.putImageData(imageData, 0, 0);
  }

  snapshot(): LayerSnapshot {
    return {
      layerId: this.id,
      imageData: this.getImageData(),
    };
  }

  restoreSnapshot(snapshot: LayerSnapshot): void {
    this.clear();
    this.putImageData(snapshot.imageData);
  }

  clone(): Layer {
    const cloned = new Layer(this.canvas.width, this.canvas.height, `${this.name} (copy)`);
    cloned.visible = this.visible;
    cloned.locked = this.locked;
    cloned.opacity = this.opacity;
    cloned.blendMode = this.blendMode;
    cloned.order = this.order;
    cloned.ctx.drawImage(this.canvas, 0, 0);
    return cloned;
  }

  toData(): LayerData {
    return {
      id: this.id,
      name: this.name,
      visible: this.visible,
      locked: this.locked,
      opacity: this.opacity,
      blendMode: this.blendMode,
      order: this.order,
    };
  }
}
