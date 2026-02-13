import type { Point } from '../types';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const HANDLE_SIZE = 6;
const HANDLE_HIT = 8;

/**
 * Scans canvas pixels to find the bounding box of non-transparent content.
 * Returns null if the canvas is entirely transparent.
 */
export function getContentBounds(
  canvas: OffscreenCanvas,
  padding = 2,
): { x: number; y: number; w: number; h: number } | null {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Reusable placement handler for floating shape/image positioning.
 * Provides drag-to-move, corner-resize, dashed border, and handle rendering.
 */
export class ShapePlacement {
  private source: OffscreenCanvas | null = null;
  private pos: Point = { x: 0, y: 0 };
  private size = { w: 0, h: 0 };

  private isDragging = false;
  private dragOffset: Point = { x: 0, y: 0 };

  private resizeCorner: Corner | null = null;
  private resizeStart = { mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 };

  private previewCanvas: OffscreenCanvas;
  private previewCtx: OffscreenCanvasRenderingContext2D;

  private lastPointer: Point = { x: 0, y: 0 };

  constructor() {
    this.previewCanvas = new OffscreenCanvas(1, 1);
    this.previewCtx = this.previewCanvas.getContext('2d')!;
  }

  get active(): boolean {
    return this.source !== null;
  }

  start(source: OffscreenCanvas, x: number, y: number, w: number, h: number): void {
    this.source = source;
    this.pos = { x, y };
    this.size = { w, h };
    this.isDragging = false;
    this.resizeCorner = null;
    this.drawPreview();
  }

  getCursor(): string {
    if (!this.source) return 'default';

    const p = this.lastPointer;
    const corner = this.hitCorner(p);
    if (corner) {
      if (corner === 'tl' || corner === 'br') return 'nwse-resize';
      return 'nesw-resize';
    }
    if (this.isInside(p)) return 'move';
    return 'default';
  }

  /**
   * Returns the preview canvas with the source drawn at current pos/size
   * plus dashed border and corner handles.
   */
  getPreviewCanvas(canvasW: number, canvasH: number): OffscreenCanvas | null {
    if (!this.source) return null;

    if (this.previewCanvas.width !== canvasW || this.previewCanvas.height !== canvasH) {
      this.previewCanvas.width = canvasW;
      this.previewCanvas.height = canvasH;
      this.drawPreview();
    }

    return this.previewCanvas;
  }

  /**
   * Handle pointer down. Returns the interaction type:
   * - 'drag': started dragging the shape
   * - 'resize': started resizing via a corner handle
   * - 'outside': clicked outside the shape (caller should confirm)
   */
  onPointerDown(p: Point): 'drag' | 'resize' | 'outside' {
    if (!this.source) return 'outside';

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
      return 'resize';
    }

    if (this.isInside(p)) {
      this.isDragging = true;
      this.dragOffset = {
        x: p.x - this.pos.x,
        y: p.y - this.pos.y,
      };
      return 'drag';
    }

    return 'outside';
  }

  onPointerMove(p: Point, shiftKey: boolean): void {
    this.lastPointer = p;
    if (!this.source) return;

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

      if (shiftKey && this.source) {
        const aspect = this.source.width / this.source.height;
        if (newW / newH > aspect) {
          newW = Math.round(newH * aspect);
        } else {
          newH = Math.round(newW / aspect);
        }
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
    }
  }

  onPointerUp(): void {
    this.isDragging = false;
    this.resizeCorner = null;
  }

  /** Draw the source onto a target context at the current position/size. */
  draw(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D): void {
    if (!this.source) return;
    ctx.drawImage(this.source, this.pos.x, this.pos.y, this.size.w, this.size.h);
  }

  cleanup(): void {
    this.source = null;
    this.isDragging = false;
    this.resizeCorner = null;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  }

  private drawPreview(): void {
    if (!this.source) return;

    const cw = this.previewCanvas.width;
    const ch = this.previewCanvas.height;
    if (cw < 1 || ch < 1) return;

    const ctx = this.previewCtx;
    ctx.clearRect(0, 0, cw, ch);

    // Draw the shape bitmap
    ctx.drawImage(this.source, this.pos.x, this.pos.y, this.size.w, this.size.h);

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
