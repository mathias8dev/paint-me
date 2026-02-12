import type { ICommand } from '../types';
import type { LayerManager } from '../layers';

export class DrawCommand implements ICommand {
  readonly label: string;
  private layerId: string;
  private beforeSnapshot: ImageData;
  private afterSnapshot: ImageData;
  private layerManager: LayerManager;

  constructor(
    layerId: string,
    beforeSnapshot: ImageData,
    afterSnapshot: ImageData,
    layerManager: LayerManager,
    label: string,
  ) {
    this.layerId = layerId;
    this.beforeSnapshot = beforeSnapshot;
    this.afterSnapshot = afterSnapshot;
    this.layerManager = layerManager;
    this.label = label;
  }

  execute(): void {
    const layer = this.layerManager.getLayer(this.layerId);
    if (layer) {
      layer.putImageData(this.afterSnapshot);
    }
  }

  undo(): void {
    const layer = this.layerManager.getLayer(this.layerId);
    if (layer) {
      layer.putImageData(this.beforeSnapshot);
    }
  }
}
