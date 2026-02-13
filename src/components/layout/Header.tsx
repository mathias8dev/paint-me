import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { DrawCommand } from '@/engine/commands/DrawCommand';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';

interface HeaderProps {
  engine: RenderEngine;
  onNewCanvas: () => void;
  onResizeCanvas: () => void;
}

export function Header({ engine, onNewCanvas, onResizeCanvas }: HeaderProps) {
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  const handleUndo = () => {
    engine.commandHistory.undo();
    engine.markDirty();
  };

  const handleRedo = () => {
    engine.commandHistory.redo();
    engine.markDirty();
  };

  const handleClear = () => {
    const layer = engine.layerManager.getActiveLayer();
    const before = layer.getImageData();
    layer.clear();
    const after = layer.getImageData();
    engine.commandHistory.push(
      new DrawCommand(layer.id, before, after, engine.layerManager, 'Clear Canvas'),
    );
    engine.markDirty();
  };

  const handleSave = () => {
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
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(32, engine.viewport.zoom * 1.25);
    engine.viewport.setZoom(newZoom);
    useCanvasStore.getState().setZoom(newZoom);
    engine.markDirty();
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, engine.viewport.zoom * 0.8);
    engine.viewport.setZoom(newZoom);
    useCanvasStore.getState().setZoom(newZoom);
    engine.markDirty();
  };

  const handleZoomReset = () => {
    engine.viewport.resetZoom();
    useCanvasStore.getState().setZoom(1);
    const container = document.querySelector('.flex-1.overflow-hidden.bg-gray-400');
    if (container) {
      engine.viewport.centerInContainer({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    }
    engine.markDirty();
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b border-gray-300">
      <span className="font-semibold text-sm text-gray-800 mr-2">Paint Me</span>

      <DropdownMenu
        label="File"
        items={[
          { label: 'New...', shortcut: 'Ctrl+N', onClick: onNewCanvas },
          { label: 'Resize Canvas...', onClick: onResizeCanvas },
          { separator: true },
          { label: 'Save as PNG', shortcut: 'Ctrl+S', onClick: handleSave },
        ]}
      />

      <DropdownMenu
        label="Edit"
        items={[
          { label: 'Undo', shortcut: 'Ctrl+Z', onClick: handleUndo, disabled: !canUndo },
          { label: 'Redo', shortcut: 'Ctrl+Y', onClick: handleRedo, disabled: !canRedo },
          { separator: true },
          { label: 'Clear Canvas', shortcut: 'Del', onClick: handleClear },
        ]}
      />

      <DropdownMenu
        label="View"
        items={[
          { label: 'Zoom In', shortcut: 'Ctrl++', onClick: handleZoomIn },
          { label: 'Zoom Out', shortcut: 'Ctrl+-', onClick: handleZoomOut },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', onClick: handleZoomReset },
        ]}
      />

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button
        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={15} />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={15} />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button
        className="p-1 rounded hover:bg-gray-200 text-gray-600"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        <ZoomOut size={15} />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-200 text-gray-600"
        onClick={handleZoomReset}
        title="Reset zoom"
      >
        <Maximize size={15} />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-200 text-gray-600"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        <ZoomIn size={15} />
      </button>
    </div>
  );
}
