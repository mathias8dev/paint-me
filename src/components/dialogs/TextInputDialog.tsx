import { useState, useRef, useEffect } from 'react';
import type { Point } from '@/engine/types';

interface TextInputDialogProps {
  position: Point;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export function TextInputDialog({ position, onConfirm, onCancel }: TextInputDialogProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm(text);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex gap-1 bg-white border border-gray-300 rounded shadow-lg p-1">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onCancel}
          className="px-2 py-1 text-sm border border-gray-200 rounded outline-none focus:border-blue-400 w-48"
          placeholder="Type text..."
        />
      </div>
    </div>
  );
}
