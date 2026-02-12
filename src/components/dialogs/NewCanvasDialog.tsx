import { useState } from 'react';

interface NewCanvasDialogProps {
  currentWidth: number;
  currentHeight: number;
  onConfirm: (width: number, height: number) => void;
  onCancel: () => void;
}

const PRESETS = [
  { label: '800 x 600', w: 800, h: 600 },
  { label: '1024 x 768', w: 1024, h: 768 },
  { label: '1280 x 720 (HD)', w: 1280, h: 720 },
  { label: '1920 x 1080 (Full HD)', w: 1920, h: 1080 },
  { label: '500 x 500', w: 500, h: 500 },
];

export function NewCanvasDialog({ currentWidth, currentHeight, onConfirm, onCancel }: NewCanvasDialogProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-xl p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-4">New Canvas</h3>

        <div className="space-y-3">
          <div className="flex gap-3">
            <label className="flex flex-col gap-1 flex-1">
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
            <label className="flex flex-col gap-1 flex-1">
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
          </div>

          <div>
            <span className="text-xs text-gray-500 block mb-1">Presets</span>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="px-2 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
                  onClick={() => { setWidth(p.w); setHeight(p.h); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
