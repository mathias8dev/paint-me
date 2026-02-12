import { useToolStore } from '@/store/useToolStore';
import { MIN_STROKE_WIDTH, MAX_STROKE_WIDTH } from '@/utils/constants';

export function BrushSizeSlider() {
  const strokeWidth = useToolStore((s) => s.strokeWidth);
  const setStrokeWidth = useToolStore((s) => s.setStrokeWidth);

  return (
    <div className="p-2 bg-gray-50 border-l border-gray-300">
      <div className="text-xs font-medium text-gray-600 mb-2">Size: {strokeWidth}px</div>
      <input
        type="range"
        min={MIN_STROKE_WIDTH}
        max={MAX_STROKE_WIDTH}
        value={strokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        className="w-full h-1.5 accent-blue-500"
      />
      {/* Preview circle */}
      <div className="flex items-center justify-center mt-2">
        <div
          className="rounded-full bg-black"
          style={{
            width: Math.min(strokeWidth, 40),
            height: Math.min(strokeWidth, 40),
          }}
        />
      </div>
    </div>
  );
}
