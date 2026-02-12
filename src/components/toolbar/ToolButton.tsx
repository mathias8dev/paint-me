import type { ToolType } from '@/engine/types';

interface ToolButtonProps {
  type: ToolType;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  shortcut: string;
  onClick: (type: ToolType) => void;
}

export function ToolButton({ type, label, icon, active, shortcut, onClick }: ToolButtonProps) {
  return (
    <button
      className={`flex items-center justify-center w-9 h-9 rounded transition-colors ${
        active
          ? 'bg-blue-500 text-white shadow-inner'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={() => onClick(type)}
      title={`${label} (${shortcut.toUpperCase()})`}
    >
      {icon}
    </button>
  );
}
