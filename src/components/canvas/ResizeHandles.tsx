import { useCallback, useRef, useState, useEffect } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import { useCanvasStore } from '@/store/useCanvasStore';

type HandleType =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

interface ResizeHandlesProps {
  engine: RenderEngine;
}

const HANDLE_SIZE = 8;

const CURSORS: Record<HandleType, string> = {
  'top-left': 'nwse-resize',
  'top': 'ns-resize',
  'top-right': 'nesw-resize',
  'left': 'ew-resize',
  'right': 'ew-resize',
  'bottom-left': 'nesw-resize',
  'bottom': 'ns-resize',
  'bottom-right': 'nwse-resize',
};

// Which axes each handle affects, and whether it resizes from the start (left/top) edge
interface HandleAxis {
  resizeW: boolean;
  resizeH: boolean;
  fromLeft: boolean;
  fromTop: boolean;
}

const HANDLE_AXES: Record<HandleType, HandleAxis> = {
  'top-left':     { resizeW: true,  resizeH: true,  fromLeft: true,  fromTop: true },
  'top':          { resizeW: false, resizeH: true,  fromLeft: false, fromTop: true },
  'top-right':    { resizeW: true,  resizeH: true,  fromLeft: false, fromTop: true },
  'left':         { resizeW: true,  resizeH: false, fromLeft: true,  fromTop: false },
  'right':        { resizeW: true,  resizeH: false, fromLeft: false, fromTop: false },
  'bottom-left':  { resizeW: true,  resizeH: true,  fromLeft: true,  fromTop: false },
  'bottom':       { resizeW: false, resizeH: true,  fromLeft: false, fromTop: false },
  'bottom-right': { resizeW: true,  resizeH: true,  fromLeft: false, fromTop: false },
};

function computeHandlePositions(engine: RenderEngine, w: number, h: number) {
  const vp = engine.viewport;
  return {
    'top-left':     vp.canvasToScreen({ x: 0, y: 0 }),
    'top':          vp.canvasToScreen({ x: w / 2, y: 0 }),
    'top-right':    vp.canvasToScreen({ x: w, y: 0 }),
    'left':         vp.canvasToScreen({ x: 0, y: h / 2 }),
    'right':        vp.canvasToScreen({ x: w, y: h / 2 }),
    'bottom-left':  vp.canvasToScreen({ x: 0, y: h }),
    'bottom':       vp.canvasToScreen({ x: w / 2, y: h }),
    'bottom-right': vp.canvasToScreen({ x: w, y: h }),
  };
}

export function ResizeHandles({ engine }: ResizeHandlesProps) {
  const [dragging, setDragging] = useState<HandleType | null>(null);
  const startMouse = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });
  const previewSize = useRef({ w: 0, h: 0 });
  const previewShift = useRef({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<HandleType, { x: number; y: number }>>(() =>
    computeHandlePositions(engine, engine.config.width, engine.config.height),
  );
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const canvasWidth = useCanvasStore((s) => s.width);
  const canvasHeight = useCanvasStore((s) => s.height);
  const zoom = useCanvasStore((s) => s.zoom);
  const panOffset = useCanvasStore((s) => s.panOffset);

  useEffect(() => {
    setPositions(computeHandlePositions(engine, engine.config.width, engine.config.height));
  }, [engine, canvasWidth, canvasHeight, zoom, panOffset]);

  const onMouseDown = useCallback(
    (type: HandleType, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(type);
      startMouse.current = { x: e.clientX, y: e.clientY };
      startSize.current = { w: engine.config.width, h: engine.config.height };
      previewSize.current = { w: engine.config.width, h: engine.config.height };
      previewShift.current = { x: 0, y: 0 };
    },
    [engine],
  );

  useEffect(() => {
    if (!dragging) return;

    const axes = HANDLE_AXES[dragging];

    const onMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startMouse.current.x) / engine.viewport.zoom;
      const dy = (e.clientY - startMouse.current.y) / engine.viewport.zoom;

      let newW = startSize.current.w;
      let newH = startSize.current.h;
      let shiftX = 0;
      let shiftY = 0;

      if (axes.resizeW) {
        if (axes.fromLeft) {
          // Dragging left edge: dx < 0 means wider
          newW = Math.round(startSize.current.w - dx);
          shiftX = Math.round(dx);
        } else {
          newW = Math.round(startSize.current.w + dx);
        }
      }
      if (axes.resizeH) {
        if (axes.fromTop) {
          newH = Math.round(startSize.current.h - dy);
          shiftY = Math.round(dy);
        } else {
          newH = Math.round(startSize.current.h + dy);
        }
      }

      // Clamp
      newW = Math.min(4096, Math.max(1, newW));
      newH = Math.min(4096, Math.max(1, newH));

      // Adjust shift if clamped
      if (axes.fromLeft && axes.resizeW) {
        shiftX = startSize.current.w - newW;
      }
      if (axes.fromTop && axes.resizeH) {
        shiftY = startSize.current.h - newH;
      }

      previewSize.current = { w: newW, h: newH };
      previewShift.current = { x: shiftX, y: shiftY };

      // Preview outline: origin shifts by shift amount in screen space
      const vp = engine.viewport;
      const origin = vp.canvasToScreen({ x: shiftX, y: shiftY });
      setPreviewRect({
        x: origin.x,
        y: origin.y,
        w: newW * vp.zoom,
        h: newH * vp.zoom,
      });
    };

    const onMouseUp = () => {
      const { w, h } = previewSize.current;
      const { x: sx, y: sy } = previewShift.current;
      engine.resize(w, h, -sx, -sy);
      useCanvasStore.getState().setDimensions(w, h);
      useCanvasStore.getState().setPanOffset(engine.viewport.offset);
      engine.markDirty();
      setPreviewRect(null);
      setDragging(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, engine]);

  // During drag, compute handle positions from preview
  const effectivePositions = previewRect
    ? (() => {
        const { w, h } = previewSize.current;
        const { x: sx, y: sy } = previewShift.current;
        const vp = engine.viewport;
        return {
          'top-left':     vp.canvasToScreen({ x: sx, y: sy }),
          'top':          vp.canvasToScreen({ x: sx + w / 2, y: sy }),
          'top-right':    vp.canvasToScreen({ x: sx + w, y: sy }),
          'left':         vp.canvasToScreen({ x: sx, y: sy + h / 2 }),
          'right':        vp.canvasToScreen({ x: sx + w, y: sy + h / 2 }),
          'bottom-left':  vp.canvasToScreen({ x: sx, y: sy + h }),
          'bottom':       vp.canvasToScreen({ x: sx + w / 2, y: sy + h }),
          'bottom-right': vp.canvasToScreen({ x: sx + w, y: sy + h }),
        };
      })()
    : positions;

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

  const handleTypes: HandleType[] = [
    'top-left', 'top', 'top-right',
    'left', 'right',
    'bottom-left', 'bottom', 'bottom-right',
  ];

  return (
    <>
      {/* Preview outline during drag */}
      {previewRect && (
        <div
          style={{
            position: 'absolute',
            left: previewRect.x,
            top: previewRect.y,
            width: previewRect.w,
            height: previewRect.h,
            border: '2px dashed #333',
            pointerEvents: 'none',
            zIndex: 19,
          }}
        />
      )}

      {handleTypes.map((type) => (
        <div
          key={type}
          style={handleStyle(effectivePositions[type], CURSORS[type])}
          onMouseDown={(e) => onMouseDown(type, e)}
        />
      ))}
    </>
  );
}
