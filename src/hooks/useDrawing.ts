import { useEffect, useCallback, useRef } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import type { PointerEventData } from '@/engine/types';
import { useCanvasStore } from '@/store/useCanvasStore';

export function useDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  engine: RenderEngine,
) {
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const spacePressed = useRef(false);

  const toCanvasEvent = useCallback(
    (e: PointerEvent): PointerEventData => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return {
          point: { x: 0, y: 0 },
          pressure: 0.5,
          button: 0,
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
        };
      }

      const rect = canvas.getBoundingClientRect();
      const screenPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const canvasPoint = engine.viewport.screenToCanvas(screenPoint);

      return {
        point: canvasPoint,
        pressure: e.pressure || 0.5,
        button: e.button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
      };
    },
    [canvasRef, engine],
  );

  // Space key tracking for pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        spacePressed.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let activeButton = -1;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      // Middle click or space+left click = pan
      if (e.button === 1 || (e.button === 0 && spacePressed.current)) {
        isPanning.current = true;
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (e.button !== 0 && e.button !== 2) return;
      activeButton = e.button;

      const event = toCanvasEvent(e);
      engine.toolRegistry.getActiveTool().onPointerDown(event);
      engine.markDirty();
    };

    const onPointerMove = (e: PointerEvent) => {
      // Panning
      if (isPanning.current) {
        const dx = e.clientX - lastPanPoint.current.x;
        const dy = e.clientY - lastPanPoint.current.y;
        engine.viewport.pan(dx, dy);
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
        useCanvasStore.getState().setPanOffset(engine.viewport.offset);
        engine.markDirty();
        return;
      }

      const event = toCanvasEvent(e);

      // Update cursor position
      useCanvasStore.getState().setCursorPosition({
        x: Math.round(event.point.x),
        y: Math.round(event.point.y),
      });

      if (activeButton >= 0) {
        const moveEvent = { ...event, button: activeButton };
        engine.toolRegistry.getActiveTool().onPointerMove(moveEvent);
        engine.markDirty();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);

      if (isPanning.current) {
        isPanning.current = false;
        return;
      }

      if (activeButton < 0) return;

      const event = { ...toCanvasEvent(e), button: activeButton };
      engine.toolRegistry.getActiveTool().onPointerUp(event);
      engine.markDirty();
      activeButton = -1;
    };

    const onPointerLeave = () => {
      useCanvasStore.getState().setCursorPosition(null);
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [canvasRef, engine, toCanvasEvent]);
}
