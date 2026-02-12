import { useState } from 'react';

interface CanvasResizeDialogProps {
  currentWidth: number;
  currentHeight: number;
  onConfirm: (width: number, height: number) => void;
  onCancel: () => void;
}

export function CanvasResizeDialog({ currentWidth, currentHeight, onConfirm, onCancel }: CanvasResizeDialogProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-xl p-5 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Resize Canvas</h3>

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Width (px)</span>
            <input
              type="number"
              min={1}
              max={4096}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Height (px)</span>
            <input
              type="number"
              min={1}
              max={4096}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-400"
            />
          </label>
          <p className="text-[10px] text-gray-400">
            Current: {currentWidth} x {currentHeight}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => onConfirm(width, height)}
          >
            Resize
          </button>
        </div>
      </div>
    </div>
  );
}
