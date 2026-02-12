import { ArrowRightLeft } from 'lucide-react';
import { useToolStore } from '@/store/useToolStore';
import { COLOR_PALETTE } from '@/utils/constants';

export function ColorPanel() {
  const primaryColor = useToolStore((s) => s.primaryColor);
  const secondaryColor = useToolStore((s) => s.secondaryColor);
  const setPrimaryColor = useToolStore((s) => s.setPrimaryColor);
  const setSecondaryColor = useToolStore((s) => s.setSecondaryColor);
  const swapColors = useToolStore((s) => s.swapColors);

  return (
    <div className="p-2 bg-gray-50 border-l border-gray-300">
      <div className="text-xs font-medium text-gray-600 mb-2">Colors</div>

      {/* Primary / Secondary display */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="relative w-12 h-12">
          {/* Secondary (behind) */}
          <div
            className="absolute bottom-0 right-0 w-8 h-8 rounded border-2 border-white shadow"
            style={{ backgroundColor: secondaryColor }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'color';
              input.value = secondaryColor;
              input.addEventListener('input', (e) =>
                setSecondaryColor((e.target as HTMLInputElement).value),
              );
              input.click();
            }}
          />
          {/* Primary (front) */}
          <div
            className="absolute top-0 left-0 w-8 h-8 rounded border-2 border-white shadow cursor-pointer z-10"
            style={{ backgroundColor: primaryColor }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'color';
              input.value = primaryColor;
              input.addEventListener('input', (e) =>
                setPrimaryColor((e.target as HTMLInputElement).value),
              );
              input.click();
            }}
          />
        </div>
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
          onClick={swapColors}
          title="Swap colors"
        >
          <ArrowRightLeft size={14} />
        </button>
      </div>

      {/* Color palette */}
      <div className="grid grid-cols-7 gap-0.5">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            className={`w-5 h-5 rounded-sm border cursor-pointer transition-transform hover:scale-110 ${
              primaryColor === color ? 'border-blue-500 border-2' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setPrimaryColor(color)}
            onContextMenu={(e) => {
              e.preventDefault();
              setSecondaryColor(color);
            }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
