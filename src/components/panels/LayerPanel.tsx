import { Plus, Trash2, Copy } from 'lucide-react';
import { useLayerStore } from '@/store/useLayerStore';
import type { RenderEngine } from '@/engine/canvas/RenderEngine';
import { LayerItem } from './LayerItem';

interface LayerPanelProps {
  engine: RenderEngine;
}

export function LayerPanel({ engine }: LayerPanelProps) {
  const layers = useLayerStore((s) => s.layers);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);

  const handleAddLayer = () => {
    engine.layerManager.addLayer();
    engine.markDirty();
  };

  const handleRemoveLayer = () => {
    engine.layerManager.removeLayer(activeLayerId);
    engine.markDirty();
  };

  const handleDuplicate = () => {
    engine.layerManager.duplicateLayer(activeLayerId);
    engine.markDirty();
  };

  const handleSelect = (id: string) => {
    engine.layerManager.setActiveLayer(id);
  };

  const handleToggleVisibility = (id: string) => {
    const layer = engine.layerManager.getLayer(id);
    if (layer) {
      engine.layerManager.setVisibility(id, !layer.visible);
      engine.markDirty();
    }
  };

  const handleToggleLock = (id: string) => {
    const layer = engine.layerManager.getLayer(id);
    if (layer) {
      engine.layerManager.setLocked(id, !layer.locked);
    }
  };

  const handleRename = (id: string, name: string) => {
    engine.layerManager.setName(id, name);
  };

  const handleOpacityChange = (opacity: number) => {
    engine.layerManager.setOpacity(activeLayerId, opacity);
    engine.markDirty();
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // Display layers top-to-bottom (reverse of order)
  const reversedLayers = [...layers].reverse();

  return (
    <div className="flex flex-col p-2 bg-gray-50 border-l border-gray-300 border-t">
      <div className="text-xs font-medium text-gray-600 mb-1">Layers</div>

      {/* Opacity slider for active layer */}
      {activeLayer && (
        <div className="flex items-center gap-1 mb-2 text-[10px] text-gray-500">
          <span>Opacity:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(activeLayer.opacity * 100)}
            onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
            className="flex-1 h-1 accent-blue-500"
          />
          <span className="w-6 text-right">{Math.round(activeLayer.opacity * 100)}%</span>
        </div>
      )}

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0 max-h-40">
        {reversedLayers.map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
            onSelect={() => handleSelect(layer.id)}
            onToggleVisibility={() => handleToggleVisibility(layer.id)}
            onToggleLock={() => handleToggleLock(layer.id)}
            onRename={(name) => handleRename(layer.id, name)}
          />
        ))}
      </div>

      {/* Layer actions */}
      <div className="flex gap-1 mt-2 pt-1 border-t border-gray-200">
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-600"
          onClick={handleAddLayer}
          title="Add layer"
        >
          <Plus size={14} />
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-600"
          onClick={handleDuplicate}
          title="Duplicate layer"
        >
          <Copy size={14} />
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30"
          onClick={handleRemoveLayer}
          disabled={layers.length <= 1}
          title="Delete layer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
