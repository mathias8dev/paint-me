import { useRef, useEffect, useCallback } from 'react';
import { RenderEngine } from '@/engine/canvas/RenderEngine';
import { useToolStore } from '@/store/useToolStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useLayerStore } from '@/store/useLayerStore';
import { useCanvasStore } from '@/store/useCanvasStore';

export function useCanvas() {
  const engineRef = useRef<RenderEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize engine once
  if (!engineRef.current) {
    const { width, height } = useCanvasStore.getState();
    engineRef.current = new RenderEngine({ width, height });
  }

  const engine = engineRef.current;

  // Attach canvas to engine
  const setCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas;
      if (canvas) {
        engine.attach(canvas);
      }
    },
    [engine],
  );

  // Sync engine state to Zustand stores
  useEffect(() => {
    const history = engine.commandHistory;
    const layerManager = engine.layerManager;

    // Sync history state
    history.setOnChange(() => {
      useHistoryStore.getState().sync(
        history.canUndo(),
        history.canRedo(),
        history.undoCount,
        history.redoCount,
      );
    });

    // Sync layer state
    const unsub = layerManager.subscribe(() => {
      useLayerStore.getState().setLayers(layerManager.getLayerDataList());
      useLayerStore.getState().setActiveLayerId(layerManager.getActiveLayerId());
    });

    // Initial sync
    useLayerStore.getState().setLayers(layerManager.getLayerDataList());
    useLayerStore.getState().setActiveLayerId(layerManager.getActiveLayerId());

    return () => {
      unsub();
      engine.detach();
    };
  }, [engine]);

  // Sync tool config when tool store changes
  useEffect(() => {
    const unsub = useToolStore.subscribe((state) => {
      const config = state.getToolConfig();
      engine.toolRegistry.updateConfig(config);
      engine.toolRegistry.setActiveTool(state.activeTool);
    });

    // Initial sync
    const state = useToolStore.getState();
    engine.toolRegistry.updateConfig(state.getToolConfig());

    return unsub;
  }, [engine]);

  return { engine, canvasRef, setCanvasRef };
}
