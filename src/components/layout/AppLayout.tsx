import { useState } from 'react';
import { useCanvas, useDrawing, useKeyboardShortcuts, useZoom } from '@/hooks';
import { useCanvasStore } from '@/store/useCanvasStore';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { ToolOptions } from '@/components/toolbar/ToolOptions';
import { ColorPanel } from '@/components/panels/ColorPanel';
import { BrushSizeSlider } from '@/components/panels/BrushSizeSlider';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { NewCanvasDialog } from '@/components/dialogs/NewCanvasDialog';
import { CanvasResizeDialog } from '@/components/dialogs/CanvasResizeDialog';

type DialogType = 'new' | 'resize' | null;

export function AppLayout() {
  const { engine, canvasRef, setCanvasRef } = useCanvas();
  const [dialog, setDialog] = useState<DialogType>(null);

  useDrawing(canvasRef, engine);
  useZoom(canvasRef, engine);
  useKeyboardShortcuts(engine);

  const handleNewCanvas = (width: number, height: number) => {
    engine.resize(width, height);
    // Fill new background with white
    const bgLayer = engine.layerManager.getActiveLayer();
    const ctx = bgLayer.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    engine.commandHistory.clear();
    useCanvasStore.getState().setDimensions(width, height);

    // Re-center
    const container = document.querySelector('.flex-1.overflow-hidden.bg-gray-400');
    if (container) {
      engine.viewport.centerInContainer({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    }
    engine.markDirty();
    setDialog(null);
  };

  const handleResizeCanvas = (width: number, height: number) => {
    engine.resize(width, height);
    useCanvasStore.getState().setDimensions(width, height);
    engine.markDirty();
    setDialog(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-200">
      <Header
        engine={engine}
        onNewCanvas={() => setDialog('new')}
        onResizeCanvas={() => setDialog('resize')}
      />
      <ToolOptions />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar />

        <CanvasWorkspace engine={engine} setCanvasRef={setCanvasRef} />

        <div className="flex flex-col w-48">
          <ColorPanel />
          <BrushSizeSlider />
          <LayerPanel engine={engine} />
        </div>
      </div>

      <StatusBar />

      {/* Dialogs */}
      {dialog === 'new' && (
        <NewCanvasDialog
          currentWidth={engine.config.width}
          currentHeight={engine.config.height}
          onConfirm={handleNewCanvas}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'resize' && (
        <CanvasResizeDialog
          currentWidth={engine.config.width}
          currentHeight={engine.config.height}
          onConfirm={handleResizeCanvas}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
