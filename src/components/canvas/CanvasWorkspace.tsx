import { useRef, useEffect, useState, useCallback } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import type { Point } from '@/engine/types';
import { useToolStore } from '@/store/useToolStore';
import { TextInputDialog } from '@/components/dialogs/TextInputDialog';
import { ResizeHandles } from './ResizeHandles';
import { ViewportScrollbars } from './ViewportScrollbars';

interface CanvasWorkspaceProps {
  engine: RenderEngine;
  setCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}

interface TextInputState {
  position: Point;
  screenPosition: Point;
  onConfirm: (text: string) => void;
}

export function CanvasWorkspace({ engine, setCanvasRef }: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState<TextInputState | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });

  // Center canvas on mount
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      engine.viewport.centerInContainer({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      engine.markDirty();
    }
  }, [engine]);

  // Resize main canvas element to container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: cw, height: ch } = entry.contentRect;
        const canvas = container.querySelector('canvas');
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = cw * dpr;
          canvas.height = ch * dpr;
          setViewportSize({ w: cw, h: ch });
          engine.markDirty();
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [engine]);

  // Setup text tool callback
  const handleTextRequest = useCallback(
    (point: Point, onConfirm: (text: string) => void) => {
      const screenPos = engine.viewport.canvasToScreen(point);
      setTextInput({
        position: point,
        screenPosition: screenPos,
        onConfirm,
      });
    },
    [engine],
  );

  // Setup eyedropper callback
  const handleColorPick = useCallback((color: string) => {
    useToolStore.getState().setPrimaryColor(color);
  }, []);

  // Wire up tool callbacks
  useEffect(() => {
    engine.toolRegistry.setupTextTool(handleTextRequest);
    engine.toolRegistry.setupEyedropper(engine.compositor, handleColorPick);
  }, [engine, handleTextRequest, handleColorPick]);

  const cursor = engine.toolRegistry.getActiveTool().getCursor();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-gray-400 relative"
    >
      <canvas
        ref={setCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor, zIndex: 1 }}
      />

      {/* Resize handles */}
      <ResizeHandles engine={engine} />

      {/* Viewport scrollbars */}
      <ViewportScrollbars
        engine={engine}
        viewportWidth={viewportSize.w}
        viewportHeight={viewportSize.h}
      />

      {/* Text input overlay */}
      {textInput && (
        <TextInputDialog
          position={textInput.screenPosition}
          onConfirm={(text) => {
            textInput.onConfirm(text);
            setTextInput(null);
            engine.markDirty();
          }}
          onCancel={() => setTextInput(null)}
        />
      )}
    </div>
  );
}
