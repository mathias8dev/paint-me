import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import type { LayerData } from '@/engine/types';

interface LayerItemProps {
  layer: LayerData;
  isActive: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onRename: (name: string) => void;
}

export function LayerItem({
  layer,
  isActive,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
}: LayerItemProps) {
  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer text-xs ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
      }`}
      onClick={onSelect}
    >
      <button
        className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      <button
        className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock();
        }}
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
      >
        {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
      </button>

      <span
        className={`flex-1 truncate dark:text-gray-200 ${!layer.visible ? 'opacity-50' : ''}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          const name = prompt('Layer name:', layer.name);
          if (name !== null && name.trim()) {
            onRename(name.trim());
          }
        }}
      >
        {layer.name}
      </span>

      <span className="text-gray-400 dark:text-gray-500 text-[10px]">
        {Math.round(layer.opacity * 100)}%
      </span>
    </div>
  );
}
