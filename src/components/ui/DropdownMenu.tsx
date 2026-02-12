import { useState, useRef, useEffect } from 'react';

interface MenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: false;
}

interface MenuSeparator {
  separator: true;
}

type MenuEntry = MenuItem | MenuSeparator;

interface DropdownMenuProps {
  label: string;
  items: MenuEntry[];
}

export function DropdownMenu({ label, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        className={`px-2 py-0.5 text-xs rounded hover:bg-gray-200 ${open ? 'bg-gray-200' : ''} text-gray-700`}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-0.5 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-40 z-50">
          {items.map((item, idx) =>
            'separator' in item && item.separator ? (
              <div key={idx} className="border-t border-gray-100 my-1" />
            ) : (
              <button
                key={idx}
                className="w-full flex items-center justify-between px-3 py-1 text-xs text-gray-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!('separator' in item)) {
                    item.onClick();
                    setOpen(false);
                  }
                }}
                disabled={'disabled' in item ? item.disabled : false}
              >
                <span>{(item as MenuItem).label}</span>
                {(item as MenuItem).shortcut && (
                  <span className="text-gray-400 ml-4">{(item as MenuItem).shortcut}</span>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
