import { LayerManager, LayerCompositor } from '../layers';
import { Viewport } from '../viewport';
import { CommandHistory } from '../commands';
import { ToolRegistry } from '../tools';
import type { CanvasConfig } from '../types';
import { createDefaultCanvasConfig, createDefaultToolConfig } from '../types';

export class RenderEngine {
  readonly layerManager: LayerManager;
  readonly compositor: LayerCompositor;
  readonly viewport: Viewport;
  readonly commandHistory: CommandHistory;
  readonly toolRegistry: ToolRegistry;

  private mainCanvas: HTMLCanvasElement | null = null;
  private mainCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private dirty = true;
  private _config: CanvasConfig;

  constructor(config?: Partial<CanvasConfig>) {
    this._config = { ...createDefaultCanvasConfig(), ...config };

    this.layerManager = new LayerManager(this._config.width, this._config.height);
    this.compositor = new LayerCompositor(this._config.width, this._config.height);
    this.viewport = new Viewport({
      width: this._config.width,
      height: this._config.height,
    });
    this.commandHistory = new CommandHistory(this._config.maxHistorySize);
    this.toolRegistry = new ToolRegistry(
      this.layerManager,
      this.commandHistory,
      this.viewport,
    );

    this.toolRegistry.updateConfig(createDefaultToolConfig());

    this.layerManager.subscribe(() => {
      this.markDirty();
    });

    // Fill the background layer with white
    const bgLayer = this.layerManager.getActiveLayer();
    const ctx = bgLayer.getContext();
    ctx.fillStyle = this._config.backgroundColor;
    ctx.fillRect(0, 0, this._config.width, this._config.height);
  }

  get config(): CanvasConfig {
    return this._config;
  }

  attach(canvas: HTMLCanvasElement): void {
    this.mainCanvas = canvas;
    this.mainCtx = canvas.getContext('2d')!;
    this.startRenderLoop();
  }

  detach(): void {
    this.stopRenderLoop();
    this.mainCanvas = null;
    this.mainCtx = null;
  }

  markDirty(): void {
    this.dirty = true;
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.dirty) {
        this.render();
        this.dirty = false;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private render(): void {
    if (!this.mainCanvas || !this.mainCtx) return;

    const ctx = this.mainCtx;
    const canvas = this.mainCanvas;

    // Clear the entire visible canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get the composited layer output
    const preview = this.toolRegistry.getActiveTool().getPreviewCanvas();
    const layers = this.layerManager.getAllLayers();
    const composited = this.compositor.compositeWithPreview(layers, preview);

    // Draw with viewport transform
    const offset = this.viewport.offset;
    const zoom = this.viewport.zoom;

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    ctx.imageSmoothingEnabled = zoom < 4;

    // Draw canvas background so transparent areas show white
    ctx.fillStyle = this._config.backgroundColor;
    ctx.fillRect(0, 0, this._config.width, this._config.height);

    ctx.drawImage(composited, 0, 0);
    ctx.restore();
  }

  resize(width: number, height: number): void {
    const oldW = this._config.width;
    const oldH = this._config.height;
    this._config.width = width;
    this._config.height = height;
    this.layerManager.resizeAll(width, height);
    this.compositor.resize(width, height);
    this.viewport.setCanvasSize({ width, height });

    // Fill expanded area of the bottom layer with background color
    if (width > oldW || height > oldH) {
      const layers = this.layerManager.getAllLayers();
      if (layers.length > 0) {
        const bgLayer = layers[0];
        const ctx = bgLayer.getContext();
        ctx.fillStyle = this._config.backgroundColor;
        if (width > oldW) {
          ctx.fillRect(oldW, 0, width - oldW, height);
        }
        if (height > oldH) {
          ctx.fillRect(0, oldH, oldW, height - oldH);
        }
      }
    }

    this.markDirty();
  }

  clear(): void {
    const layer = this.layerManager.getActiveLayer();
    layer.clear();
    this.markDirty();
  }
}
