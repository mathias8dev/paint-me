import { useEffect } from 'react';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import type { ToolType } from '@/engine/types';
import { ToolType as TT } from '@/engine/types';
import { DrawCommand } from '@/engine/commands/DrawCommand';
import { useToolStore } from '@/store/useToolStore';
import type { PasteTool } from '@/engine/tools/PasteTool';

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
  u: TT.RoundedRectangle,
  x: TT.Star,
  w: TT.Triangle,
  d: TT.Arc,
};

export function useKeyboardShortcuts(engine: RenderEngine) {
  useEffect(() => {
    const getPasteTool = () =>
      engine.toolRegistry.getTool(TT.Paste) as PasteTool | undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Placement mode: Enter to confirm, Escape to cancel (shape tools + paste)
      const activeTool = engine.toolRegistry.getActiveTool();
      if (activeTool.hasPlacement()) {
        if (e.key === 'Enter') {
          e.preventDefault();
          activeTool.confirmPlacement();
          engine.markDirty();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          activeTool.cancelPlacement();
          engine.markDirty();
          return;
        }
      }

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

      // Clear canvas: Delete
      if (e.key === 'Delete' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const layer = engine.layerManager.getActiveLayer();
        const before = layer.getImageData();
        layer.clear();
        const after = layer.getImageData();
        engine.commandHistory.push(
          new DrawCommand(layer.id, before, after, engine.layerManager, 'Clear Canvas'),
        );
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

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        const blob = item.getAsFile();
        if (!blob) continue;

        e.preventDefault();
        createImageBitmap(blob, {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        }).then((bitmap) => {
          const pasteTool = getPasteTool();
          if (!pasteTool) {
            bitmap.close();
            return;
          }

          const prevTool = useToolStore.getState().activeTool;
          pasteTool.setImage(bitmap);
          pasteTool.setOnDone(() => {
            useToolStore.getState().setActiveTool(prevTool);
            engine.markDirty();
          });
          useToolStore.getState().setActiveTool(TT.Paste);
          engine.markDirty();
        });
        break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [engine]);
}
