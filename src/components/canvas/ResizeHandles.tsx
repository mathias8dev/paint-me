import { useCallback, useRef, useState, useEffect } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import { useCanvasStore } from '@/store/useCanvasStore';

type HandleType = 'right' | 'bottom' | 'corner';

interface ResizeHandlesProps {
  engine: RenderEngine;
}

const HANDLE_SIZE = 8;

export function ResizeHandles({ engine }: ResizeHandlesProps) {
  const [dragging, setDragging] = useState<HandleType | null>(null);
  const startMouse = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });
  const [positions, setPositions] = useState({ right: { x: 0, y: 0 }, bottom: { x: 0, y: 0 }, corner: { x: 0, y: 0 } });

  // Recalculate handle positions whenever canvas state changes
  const canvasWidth = useCanvasStore((s) => s.width);
  const canvasHeight = useCanvasStore((s) => s.height);
  const zoom = useCanvasStore((s) => s.zoom);
  const panOffset = useCanvasStore((s) => s.panOffset);

  useEffect(() => {
    const update = () => {
      const vp = engine.viewport;
      const w = engine.config.width;
      const h = engine.config.height;

      // Screen positions for the 3 handles
      const rightEdgeMid = vp.canvasToScreen({ x: w, y: h / 2 });
      const bottomEdgeMid = vp.canvasToScreen({ x: w / 2, y: h });
      const cornerPoint = vp.canvasToScreen({ x: w, y: h });

      setPositions({
        right: { x: rightEdgeMid.x, y: rightEdgeMid.y },
        bottom: { x: bottomEdgeMid.x, y: bottomEdgeMid.y },
        corner: { x: cornerPoint.x, y: cornerPoint.y },
      });
    };

    update();
  }, [engine, canvasWidth, canvasHeight, zoom, panOffset]);

  const onMouseDown = useCallback(
    (type: HandleType, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(type);
      startMouse.current = { x: e.clientX, y: e.clientY };
      startSize.current = { w: engine.config.width, h: engine.config.height };
    },
    [engine],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startMouse.current.x) / engine.viewport.zoom;
      const dy = (e.clientY - startMouse.current.y) / engine.viewport.zoom;

      let newW = startSize.current.w;
      let newH = startSize.current.h;

      if (dragging === 'right' || dragging === 'corner') {
        newW = Math.max(1, Math.round(startSize.current.w + dx));
      }
      if (dragging === 'bottom' || dragging === 'corner') {
        newH = Math.max(1, Math.round(startSize.current.h + dy));
      }

      // Clamp to reasonable limits
      newW = Math.min(4096, Math.max(1, newW));
      newH = Math.min(4096, Math.max(1, newH));

      engine.resize(newW, newH);
      useCanvasStore.getState().setDimensions(newW, newH);
      engine.markDirty();
    };

    const onMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, engine]);

  const handleStyle = (pos: { x: number; y: number }, cursor: string): React.CSSProperties => ({
    position: 'absolute',
    left: pos.x - HANDLE_SIZE / 2,
    top: pos.y - HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    cursor,
    backgroundColor: '#ffffff',
    border: '1px solid #666',
    zIndex: 20,
  });

  return (
    <>
      {/* Right edge handle */}
      <div
        style={handleStyle(positions.right, 'ew-resize')}
        onMouseDown={(e) => onMouseDown('right', e)}
      />

      {/* Bottom edge handle */}
      <div
        style={handleStyle(positions.bottom, 'ns-resize')}
        onMouseDown={(e) => onMouseDown('bottom', e)}
      />

      {/* Bottom-right corner handle */}
      <div
        style={handleStyle(positions.corner, 'nwse-resize')}
        onMouseDown={(e) => onMouseDown('corner', e)}
      />
    </>
  );
}
