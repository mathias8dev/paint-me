import { useEffect } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import type { ToolType } from '@/engine/types';
import { ToolType as TT } from '@/engine/types';
import { useToolStore } from '@/store/useToolStore';

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  p: TT.Pencil,
  e: TT.Eraser,
  l: TT.Line,
  r: TT.Rectangle,
  c: TT.Circle,
  g: TT.Fill,
  t: TT.Text,
  s: TT.Selection,
  i: TT.Eyedropper,
  y: TT.Spray,
  o: TT.Polygon,
  a: TT.Arrow,
};

export function useKeyboardShortcuts(engine: RenderEngine) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Undo: Ctrl+Z
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        engine.commandHistory.undo();
        engine.markDirty();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey && e.key === 'y') ||
        (e.ctrlKey && e.shiftKey && e.key === 'Z')
      ) {
        e.preventDefault();
        engine.commandHistory.redo();
        engine.markDirty();
        return;
      }

      // Save: Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const layers = engine.layerManager.getAllLayers();
        const composited = engine.compositor.composite(layers);
        composited.convertToBlob({ type: 'image/png' }).then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'paint-me.png';
          a.click();
          URL.revokeObjectURL(url);
        });
        return;
      }

      // Zoom: Ctrl+= / Ctrl+- / Ctrl+0
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const newZoom = Math.min(32, engine.viewport.zoom * 1.25);
        engine.viewport.setZoom(newZoom);
        engine.markDirty();
        return;
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        const newZoom = Math.max(0.1, engine.viewport.zoom * 0.8);
        engine.viewport.setZoom(newZoom);
        engine.markDirty();
        return;
      }
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        engine.viewport.resetZoom();
        engine.markDirty();
        return;
      }

      // Tool shortcuts (no modifiers)
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (tool) {
          useToolStore.getState().setActiveTool(tool);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [engine]);
}
