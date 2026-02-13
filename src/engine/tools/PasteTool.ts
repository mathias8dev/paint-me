import { BaseTool } from './BaseTool';
import { DrawCommand } from '../commands/DrawCommand';
import { ToolType } from '../types';
import type { PointerEventData, Point } from '../types';
import type { LayerManager } from '../layers';
import type { CommandHistory } from '../commands';
import type { Viewport } from '../viewport';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const HANDLE_SIZE = 6;
const HANDLE_HIT = 8;

export class PasteTool extends BaseTool {
  private image: ImageBitmap | null = null;
  private pos: Point = { x: 0, y: 0 };
  private size = { w: 0, h: 0 };

  private isDragging = false;
  private dragOffset: Point = { x: 0, y: 0 };

  private resizeCorner: Corner | null = null;
  private resizeStart = { mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 };

  private previewCanvas: OffscreenCanvas;
  private previewCtx: OffscreenCanvasRenderingContext2D;

  private onDone: ((confirmed: boolean) => void) | null = null;
  private lastPointer: Point = { x: 0, y: 0 };

  constructor(
    layerManager: LayerManager,
    commandHistory: CommandHistory,
    viewport: Viewport,
  ) {
    super(ToolType.Paste, 'Paste', '', layerManager, commandHistory, viewport);
    this.previewCanvas = new OffscreenCanvas(1, 1);
    this.previewCtx = this.previewCanvas.getContext('2d')!;
  }

  setImage(image: ImageBitmap): void {
    this.image = image;
    this.size = { w: image.width, h: image.height };

    // Center image on the canvas
    const layer = this.layerManager.getActiveLayer();
    this.pos = {
      x: Math.round(layer.width / 2 - image.width / 2),
      y: Math.round(layer.height / 2 - image.height / 2),
    };

    this.isDragging = false;
    this.resizeCorner = null;
    this.drawPreview();
  }

  setOnDone(cb: (confirmed: boolean) => void): void {
    this.onDone = cb;
  }

  hasImage(): boolean {
    return this.image !== null;
  }

  confirm(): void {
    if (!this.image) return;

    const layer = this.layerManager.getActiveLayer();
    const before = layer.getImageData();
    const ctx = layer.getContext();
    ctx.drawImage(this.image, this.pos.x, this.pos.y, this.size.w, this.size.h);
    const after = layer.getImageData();
    this.commandHistory.push(
      new DrawCommand(layer.id, before, after, this.layerManager, 'Paste'),
    );

    this.cleanup();
    this.onDone?.(true);
  }

  cancel(): void {
    this.cleanup();
    this.onDone?.(false);
  }

  onDeactivate(): void {
    if (this.image) {
      this.confirm();
    }
  }

  private cleanup(): void {
    if (this.image) {
      this.image.close();
      this.image = null;
    }
    this.isDragging = false;
    this.resizeCorner = null;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  }

  getCursor(): string {
    if (!this.image) return 'default';

    const p = this.lastPointer;
    const corner = this.hitCorner(p);
    if (corner) {
      if (corner === 'tl' || corner === 'br') return 'nwse-resize';
      return 'nesw-resize';
    }
    if (this.isInside(p)) return 'move';
    return 'default';
  }

  onPointerDown(event: PointerEventData): void {
    if (!this.image) return;
    const p = event.point;

    // Check resize handles first
    const corner = this.hitCorner(p);
    if (corner) {
      this.resizeCorner = corner;
      this.resizeStart = {
        mx: p.x,
        my: p.y,
        x: this.pos.x,
        y: this.pos.y,
        w: this.size.w,
        h: this.size.h,
      };
      return;
    }

    // Check if inside image → start drag
    if (this.isInside(p)) {
      this.isDragging = true;
      this.dragOffset = {
        x: p.x - this.pos.x,
        y: p.y - this.pos.y,
      };
      return;
    }

    // Click outside → confirm
    this.confirm();
  }

  onPointerMove(event: PointerEventData): void {
    this.lastPointer = event.point;

    if (!this.image) return;
    const p = event.point;

    if (this.isDragging) {
      this.pos = {
        x: Math.round(p.x - this.dragOffset.x),
        y: Math.round(p.y - this.dragOffset.y),
      };
      this.drawPreview();
      return;
    }

    if (this.resizeCorner) {
      const dx = p.x - this.resizeStart.mx;
      const dy = p.y - this.resizeStart.my;
      const s = this.resizeStart;

      let newX = s.x;
      let newY = s.y;
      let newW = s.w;
      let newH = s.h;

      switch (this.resizeCorner) {
        case 'br':
          newW = Math.max(10, s.w + dx);
          newH = Math.max(10, s.h + dy);
          break;
        case 'bl':
          newW = Math.max(10, s.w - dx);
          newH = Math.max(10, s.h + dy);
          newX = s.x + s.w - newW;
          break;
        case 'tr':
          newW = Math.max(10, s.w + dx);
          newH = Math.max(10, s.h - dy);
          newY = s.y + s.h - newH;
          break;
        case 'tl':
          newW = Math.max(10, s.w - dx);
          newH = Math.max(10, s.h - dy);
          newX = s.x + s.w - newW;
          newY = s.y + s.h - newH;
          break;
      }

      // Shift: constrain aspect ratio
      if (event.shiftKey && this.image) {
        const aspect = this.image.width / this.image.height;
        if (newW / newH > aspect) {
          newW = Math.round(newH * aspect);
        } else {
          newH = Math.round(newW / aspect);
        }
        // Re-anchor for top-left and bottom-left corners
        if (this.resizeCorner === 'tl') {
          newX = s.x + s.w - newW;
          newY = s.y + s.h - newH;
        } else if (this.resizeCorner === 'bl') {
          newX = s.x + s.w - newW;
        } else if (this.resizeCorner === 'tr') {
          newY = s.y + s.h - newH;
        }
      }

      this.pos = { x: Math.round(newX), y: Math.round(newY) };
      this.size = { w: Math.round(newW), h: Math.round(newH) };
      this.drawPreview();
      return;
    }
  }

  onPointerUp(_event: PointerEventData): void {
    this.isDragging = false;
    this.resizeCorner = null;
  }

  getPreviewCanvas(): OffscreenCanvas | null {
    return this.image ? this.previewCanvas : null;
  }

  private drawPreview(): void {
    if (!this.image) return;

    const layer = this.layerManager.getActiveLayer();
    const cw = layer.width;
    const ch = layer.height;

    if (this.previewCanvas.width !== cw || this.previewCanvas.height !== ch) {
      this.previewCanvas.width = cw;
      this.previewCanvas.height = ch;
    }

    const ctx = this.previewCtx;
    ctx.clearRect(0, 0, cw, ch);

    // Draw the pasted image
    ctx.drawImage(this.image, this.pos.x, this.pos.y, this.size.w, this.size.h);

    // Dashed selection border
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(this.pos.x, this.pos.y, this.size.w, this.size.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineDashOffset = 5;
    ctx.strokeRect(this.pos.x, this.pos.y, this.size.w, this.size.h);
    ctx.restore();

    // Corner handles
    const corners = this.getCorners();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (const c of Object.values(corners)) {
      ctx.fillRect(c.x - HANDLE_SIZE / 2, c.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeRect(c.x - HANDLE_SIZE / 2, c.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    }
  }

  private getCorners(): Record<Corner, Point> {
    return {
      tl: { x: this.pos.x, y: this.pos.y },
      tr: { x: this.pos.x + this.size.w, y: this.pos.y },
      bl: { x: this.pos.x, y: this.pos.y + this.size.h },
      br: { x: this.pos.x + this.size.w, y: this.pos.y + this.size.h },
    };
  }

  private hitCorner(p: Point): Corner | null {
    const corners = this.getCorners();
    for (const [key, c] of Object.entries(corners)) {
      if (Math.abs(p.x - c.x) <= HANDLE_HIT && Math.abs(p.y - c.y) <= HANDLE_HIT) {
        return key as Corner;
      }
    }
    return null;
  }

  private isInside(p: Point): boolean {
    return (
      p.x >= this.pos.x &&
      p.x <= this.pos.x + this.size.w &&
      p.y >= this.pos.y &&
      p.y <= this.pos.y + this.size.h
    );
  }
}
