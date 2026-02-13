import { useRef, useCallback, useEffect, useState } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import { useCanvasStore } from '@/store/useCanvasStore';

interface ViewportScrollbarsProps {
  engine: RenderEngine;
  viewportWidth: number;
  viewportHeight: number;
}

const THUMB_SIZE = 6;
const THUMB_SIZE_HOVER = 10;
const MIN_THUMB = 30;
const HIDE_DELAY = 1200;
const MARGIN = 3;

export function ViewportScrollbars({ engine, viewportWidth, viewportHeight }: ViewportScrollbarsProps) {
  const canvasWidth = useCanvasStore((s) => s.width);
  const canvasHeight = useCanvasStore((s) => s.height);
  const zoom = useCanvasStore((s) => s.zoom);
  const panOffset = useCanvasStore((s) => s.panOffset);

  const contentW = canvasWidth * zoom;
  const contentH = canvasHeight * zoom;

  const minX = Math.min(0, panOffset.x);
  const maxX = Math.max(viewportWidth, panOffset.x + contentW);
  const minY = Math.min(0, panOffset.y);
  const maxY = Math.max(viewportHeight, panOffset.y + contentH);

  const totalW = maxX - minX;
  const totalH = maxY - minY;

  const showH = totalW > viewportWidth + 1;
  const showV = totalH > viewportHeight + 1;

  // Horizontal thumb geometry
  const hTrackW = viewportWidth - 2 * MARGIN;
  const hThumbRatio = Math.min(1, viewportWidth / totalW);
  const hThumbW = Math.max(MIN_THUMB, hTrackW * hThumbRatio);
  const hScrollableRange = totalW - viewportWidth;
  const hScrollPos = -minX;
  const hProgress = hScrollableRange > 0 ? hScrollPos / hScrollableRange : 0;
  const hThumbX = Math.max(0, Math.min(hTrackW - hThumbW, hProgress * (hTrackW - hThumbW)));

  // Vertical thumb geometry
  const vTrackH = viewportHeight - 2 * MARGIN;
  const vThumbRatio = Math.min(1, viewportHeight / totalH);
  const vThumbH = Math.max(MIN_THUMB, vTrackH * vThumbRatio);
  const vScrollableRange = totalH - viewportHeight;
  const vScrollPos = -minY;
  const vProgress = vScrollableRange > 0 ? vScrollPos / vScrollableRange : 0;
  const vThumbY = Math.max(0, Math.min(vTrackH - vThumbH, vProgress * (vTrackH - vThumbH)));

  // Store latest geometry in refs so drag handler can access fresh values
  const geoRef = useRef({ hTrackW, hThumbW, vTrackH, vThumbH, contentW, contentH, viewportWidth, viewportHeight });
  geoRef.current = { hTrackW, hThumbW, vTrackH, vThumbH, contentW, contentH, viewportWidth, viewportHeight };

  // Visibility state
  const [visible, setVisible] = useState(false);
  const [hoveredAxis, setHoveredAxis] = useState<'h' | 'v' | null>(null);
  const [draggingAxis, setDraggingAxis] = useState<'h' | 'v' | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flashScrollbars = useCallback(() => {
    setVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY);
  }, []);

  // Show scrollbars on any viewport/size change
  const prevOffset = useRef(panOffset);
  const prevZoom = useRef(zoom);
  const prevDims = useRef({ w: canvasWidth, h: canvasHeight });

  useEffect(() => {
    const offsetChanged = prevOffset.current.x !== panOffset.x || prevOffset.current.y !== panOffset.y;
    const zoomChanged = prevZoom.current !== zoom;
    const dimsChanged = prevDims.current.w !== canvasWidth || prevDims.current.h !== canvasHeight;
    prevOffset.current = panOffset;
    prevZoom.current = zoom;
    prevDims.current = { w: canvasWidth, h: canvasHeight };

    if ((offsetChanged || zoomChanged || dimsChanged) && (showH || showV)) {
      flashScrollbars();
    }
  }, [panOffset, zoom, canvasWidth, canvasHeight, showH, showV, flashScrollbars]);

  // Hover handlers
  const onMouseEnterH = useCallback(() => {
    setHoveredAxis('h');
    setVisible(true);
    clearTimeout(hideTimer.current);
  }, []);
  const onMouseEnterV = useCallback(() => {
    setHoveredAxis('v');
    setVisible(true);
    clearTimeout(hideTimer.current);
  }, []);
  const onMouseLeave = useCallback(() => {
    setHoveredAxis(null);
    if (!draggingAxis) {
      hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
    }
  }, [draggingAxis]);

  // Drag: attach listeners directly in mousedown, use refs for fresh geometry
  const onMouseDown = useCallback((axis: 'h' | 'v', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDraggingAxis(axis);
    setVisible(true);
    clearTimeout(hideTimer.current);

    const startMouse = axis === 'h' ? e.clientX : e.clientY;
    const startThumb = axis === 'h' ? hThumbX : vThumbY;

    const onMouseMove = (me: MouseEvent) => {
      const geo = geoRef.current;
      const pos = axis === 'h' ? me.clientX : me.clientY;
      const delta = pos - startMouse;
      const trackLen = axis === 'h' ? geo.hTrackW : geo.vTrackH;
      const thumbLen = axis === 'h' ? geo.hThumbW : geo.vThumbH;

      const newThumbPos = startThumb + delta;
      const progress = Math.max(0, Math.min(1, newThumbPos / (trackLen - thumbLen)));

      const cw = axis === 'h' ? geo.contentW : geo.contentH;
      const vw = axis === 'h' ? geo.viewportWidth : geo.viewportHeight;
      const offsetMax = Math.max(0, (vw - cw) / 2);
      const offsetMin = Math.min(0, vw - cw);
      const newOffset = offsetMax - progress * (offsetMax - offsetMin);

      const offset = engine.viewport.offset;
      if (axis === 'h') {
        engine.viewport.setOffset({ x: newOffset, y: offset.y });
      } else {
        engine.viewport.setOffset({ x: offset.x, y: newOffset });
      }
      useCanvasStore.getState().setPanOffset(engine.viewport.offset);
      engine.markDirty();
    };

    const onMouseUp = () => {
      setDraggingAxis(null);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [hThumbX, vThumbY, engine]);

  if (!showH && !showV) return null;

  const isHovered = hoveredAxis !== null;
  const isDragging = draggingAxis !== null;
  const opacity = isDragging ? 0.7 : isHovered ? 0.6 : visible ? 0.5 : 0;

  return (
    <>
      {/* Horizontal scrollbar */}
      {showH && (
        <div
          onMouseEnter={onMouseEnterH}
          onMouseLeave={onMouseLeave}
          style={{
            position: 'absolute',
            left: MARGIN,
            bottom: MARGIN,
            width: hTrackW,
            height: hoveredAxis === 'h' || draggingAxis === 'h' ? THUMB_SIZE_HOVER : THUMB_SIZE,
            zIndex: 30,
            pointerEvents: 'auto',
            transition: 'height 0.15s ease, opacity 0.3s ease',
            opacity,
          }}
        >
          <div
            onMouseDown={(e) => onMouseDown('h', e)}
            style={{
              position: 'absolute',
              left: hThumbX,
              top: 0,
              width: hThumbW,
              height: '100%',
              backgroundColor: draggingAxis === 'h' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)',
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          />
        </div>
      )}

      {/* Vertical scrollbar */}
      {showV && (
        <div
          onMouseEnter={onMouseEnterV}
          onMouseLeave={onMouseLeave}
          style={{
            position: 'absolute',
            right: MARGIN,
            top: MARGIN,
            width: hoveredAxis === 'v' || draggingAxis === 'v' ? THUMB_SIZE_HOVER : THUMB_SIZE,
            height: vTrackH,
            zIndex: 30,
            pointerEvents: 'auto',
            transition: 'width 0.15s ease, opacity 0.3s ease',
            opacity,
          }}
        >
          <div
            onMouseDown={(e) => onMouseDown('v', e)}
            style={{
              position: 'absolute',
              top: vThumbY,
              right: 0,
              width: '100%',
              height: vThumbH,
              backgroundColor: draggingAxis === 'v' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)',
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          />
        </div>
      )}
    </>
  );
}
