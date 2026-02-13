import {
  Pencil, Eraser, Minus, Square, Circle, PaintBucket,
  Type, BoxSelect, Pipette, SprayCan, Pentagon, MoveRight,
  SquareRoundCorner, Star, Triangle, PieChart,
} from 'lucide-react';
import { ToolType } from '@/engine/types';
import { useToolStore } from '@/store/useToolStore';
import { ToolButton } from './ToolButton';

const TOOLS = [
  { type: ToolType.Pencil, label: 'Pencil', icon: <Pencil size={18} />, shortcut: 'p' },
  { type: ToolType.Eraser, label: 'Eraser', icon: <Eraser size={18} />, shortcut: 'e' },
  { type: ToolType.Line, label: 'Line', icon: <Minus size={18} />, shortcut: 'l' },
  { type: ToolType.Rectangle, label: 'Rectangle', icon: <Square size={18} />, shortcut: 'r' },
  { type: ToolType.Circle, label: 'Circle', icon: <Circle size={18} />, shortcut: 'c' },
  { type: ToolType.Polygon, label: 'Polygon', icon: <Pentagon size={18} />, shortcut: 'o' },
  { type: ToolType.Arrow, label: 'Arrow', icon: <MoveRight size={18} />, shortcut: 'a' },
  { type: ToolType.RoundedRectangle, label: 'Rounded Rect', icon: <SquareRoundCorner size={18} />, shortcut: 'u' },
  { type: ToolType.Star, label: 'Star', icon: <Star size={18} />, shortcut: 'x' },
  { type: ToolType.Triangle, label: 'Triangle', icon: <Triangle size={18} />, shortcut: 'w' },
  { type: ToolType.Arc, label: 'Arc', icon: <PieChart size={18} />, shortcut: 'd' },
  { type: ToolType.Fill, label: 'Fill', icon: <PaintBucket size={18} />, shortcut: 'g' },
  { type: ToolType.Text, label: 'Text', icon: <Type size={18} />, shortcut: 't' },
  { type: ToolType.Selection, label: 'Selection', icon: <BoxSelect size={18} />, shortcut: 's' },
  { type: ToolType.Eyedropper, label: 'Eyedropper', icon: <Pipette size={18} />, shortcut: 'i' },
  { type: ToolType.Spray, label: 'Spray', icon: <SprayCan size={18} />, shortcut: 'y' },
];

export function Toolbar() {
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  return (
    <div className="flex flex-col gap-1 p-2 bg-gray-50 border-r border-gray-300 w-12">
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.type}
          type={tool.type}
          label={tool.label}
          icon={tool.icon}
          active={activeTool === tool.type}
          shortcut={tool.shortcut}
          onClick={setActiveTool}
        />
      ))}
    </div>
  );
}
