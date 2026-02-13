import { useEffect } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import { useCanvasStore } from '@/store/useCanvasStore';

export function useZoom(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  engine: RenderEngine,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Ctrl/Meta + wheel = zoom
      if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const focalPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        const currentZoom = engine.viewport.zoom;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(32, currentZoom * delta));

        engine.viewport.setZoom(newZoom, focalPoint);
        useCanvasStore.getState().setZoom(newZoom);
        useCanvasStore.getState().setPanOffset(engine.viewport.offset);
        engine.markDirty();
        return;
      }

      // Regular wheel = pan
      // Shift+wheel swaps axes (horizontal scroll)
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }

      engine.viewport.pan(-dx, -dy);
      useCanvasStore.getState().setPanOffset(engine.viewport.offset);
      engine.markDirty();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasRef, engine]);
}
