import type { Layer } from './Layer';

export class LayerCompositor {
  private compositeCanvas: OffscreenCanvas;
  private compositeCtx: OffscreenCanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.compositeCanvas = new OffscreenCanvas(width, height);
    this.compositeCtx = this.compositeCanvas.getContext('2d')!;
  }

  composite(layers: Layer[]): OffscreenCanvas {
    this.compositeCtx.clearRect(
      0,
      0,
      this.compositeCanvas.width,
      this.compositeCanvas.height,
    );

    for (const layer of layers) {
      if (!layer.visible) continue;

      this.compositeCtx.save();
      this.compositeCtx.globalAlpha = layer.opacity;
      this.compositeCtx.globalCompositeOperation = layer.blendMode;
      this.compositeCtx.drawImage(layer.getCanvas(), 0, 0);
      this.compositeCtx.restore();
    }

    return this.compositeCanvas;
  }

  compositeWithPreview(
    layers: Layer[],
    preview: OffscreenCanvas | null,
  ): OffscreenCanvas {
    this.composite(layers);

    if (preview) {
      this.compositeCtx.save();
      this.compositeCtx.globalAlpha = 1;
      this.compositeCtx.globalCompositeOperation = 'source-over';
      this.compositeCtx.drawImage(preview, 0, 0);
      this.compositeCtx.restore();
    }

    return this.compositeCanvas;
  }

  resize(width: number, height: number): void {
    this.compositeCanvas = new OffscreenCanvas(width, height);
    this.compositeCtx = this.compositeCanvas.getContext('2d')!;
  }

  getCompositeCanvas(): OffscreenCanvas {
    return this.compositeCanvas;
  }

  toBlob(format = 'image/png', quality = 1): Promise<Blob> {
    return this.compositeCanvas.convertToBlob({ type: format, quality });
  }
}
