import { useCanvasStore } from '@/store/useCanvasStore';

export function StatusBar() {
  const cursorPosition = useCanvasStore((s) => s.cursorPosition);
  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);
  const zoom = useCanvasStore((s) => s.zoom);

  return (
    <div className="flex items-center gap-4 px-3 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300">
      <span>
        {cursorPosition
          ? `Position: ${cursorPosition.x}, ${cursorPosition.y}`
          : 'Position: -'}
      </span>
      <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
      <span>Zoom: {Math.round(zoom * 100)}%</span>
      <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
      <span>
        Canvas: {width} x {height}
      </span>
    </div>
  );
}
