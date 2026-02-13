import { ToolType } from '@/engine/types';
import { useToolStore } from '@/store/useToolStore';

const SHAPE_TOOLS: string[] = [
  ToolType.Rectangle, ToolType.Circle, ToolType.Polygon, ToolType.Arrow,
  ToolType.RoundedRectangle, ToolType.Star, ToolType.Triangle, ToolType.Arc,
];

export function ToolOptions() {
  const activeTool = useToolStore((s) => s.activeTool);
  const fillEnabled = useToolStore((s) => s.fillEnabled);
  const setFillEnabled = useToolStore((s) => s.setFillEnabled);
  const opacity = useToolStore((s) => s.opacity);
  const setOpacity = useToolStore((s) => s.setOpacity);

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-white border-b border-gray-200 text-xs">
      {/* Opacity */}
      <label className="flex items-center gap-1 text-gray-600">
        Opacity:
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="w-16 h-1 accent-blue-500"
        />
        <span className="w-7 text-right">{Math.round(opacity * 100)}%</span>
      </label>

      {/* Fill toggle for shape tools */}
      {SHAPE_TOOLS.includes(activeTool) && (
        <label className="flex items-center gap-1 text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={fillEnabled}
            onChange={(e) => setFillEnabled(e.target.checked)}
            className="accent-blue-500"
          />
          Fill
        </label>
      )}
    </div>
  );
}
