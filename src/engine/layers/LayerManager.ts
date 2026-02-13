import { Layer } from './Layer';
import type { BlendMode, LayerData } from '../types';

export type LayerEventType = 'add' | 'remove' | 'reorder' | 'update' | 'active-change';

export interface LayerEvent {
  type: LayerEventType;
  layerId?: string;
}

export type LayerEventListener = (event: LayerEvent) => void;

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private order: string[] = [];
  private activeLayerId = '';
  private listeners: Set<LayerEventListener> = new Set();

  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const initial = this.addLayer('Background');
    this.activeLayerId = initial.id;
  }

  addLayer(name?: string): Layer {
    const layerName = name ?? `Layer ${this.layers.size + 1}`;
    const layer = new Layer(this.canvasWidth, this.canvasHeight, layerName);
    layer.order = this.order.length;
    this.layers.set(layer.id, layer);
    this.order.push(layer.id);
    this.emit({ type: 'add', layerId: layer.id });
    return layer;
  }

  removeLayer(id: string): void {
    if (this.layers.size <= 1) return;
    this.layers.delete(id);
    this.order = this.order.filter((lid) => lid !== id);
    this.updateOrders();
    if (this.activeLayerId === id) {
      this.activeLayerId = this.order[this.order.length - 1];
      this.emit({ type: 'active-change', layerId: this.activeLayerId });
    }
    this.emit({ type: 'remove', layerId: id });
  }

  duplicateLayer(id: string): Layer | undefined {
    const original = this.layers.get(id);
    if (!original) return undefined;
    const cloned = original.clone();
    const idx = this.order.indexOf(id);
    cloned.order = idx + 1;
    this.layers.set(cloned.id, cloned);
    this.order.splice(idx + 1, 0, cloned.id);
    this.updateOrders();
    this.emit({ type: 'add', layerId: cloned.id });
    return cloned;
  }

  getLayer(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  getActiveLayer(): Layer {
    return this.layers.get(this.activeLayerId)!;
  }

  getActiveLayerId(): string {
    return this.activeLayerId;
  }

  setActiveLayer(id: string): void {
    if (this.layers.has(id)) {
      this.activeLayerId = id;
      this.emit({ type: 'active-change', layerId: id });
    }
  }

  getAllLayers(): Layer[] {
    return this.order.map((id) => this.layers.get(id)!);
  }

  getVisibleLayers(): Layer[] {
    return this.getAllLayers().filter((l) => l.visible);
  }

  setVisibility(id: string, visible: boolean): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.visible = visible;
      this.emit({ type: 'update', layerId: id });
    }
  }

  setOpacity(id: string, opacity: number): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      this.emit({ type: 'update', layerId: id });
    }
  }

  setLocked(id: string, locked: boolean): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.locked = locked;
      this.emit({ type: 'update', layerId: id });
    }
  }

  setName(id: string, name: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.name = name;
      this.emit({ type: 'update', layerId: id });
    }
  }

  setBlendMode(id: string, mode: BlendMode): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.blendMode = mode;
      this.emit({ type: 'update', layerId: id });
    }
  }

  reorder(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.order.length) return;
    if (toIndex < 0 || toIndex >= this.order.length) return;
    const [moved] = this.order.splice(fromIndex, 1);
    this.order.splice(toIndex, 0, moved);
    this.updateOrders();
    this.emit({ type: 'reorder' });
  }

  resizeAll(width: number, height: number, shiftX = 0, shiftY = 0): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    for (const layer of this.layers.values()) {
      layer.resize(width, height, shiftX, shiftY);
    }
    this.emit({ type: 'update' });
  }

  getLayerDataList(): LayerData[] {
    return this.getAllLayers().map((l) => l.toData());
  }

  subscribe(listener: LayerEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: LayerEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private updateOrders(): void {
    this.order.forEach((id, idx) => {
      const layer = this.layers.get(id);
      if (layer) layer.order = idx;
    });
  }
}
