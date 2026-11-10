import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function Select({ label, value, options, onChange, placeholder, className = '', id }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  const commit = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <span className="block text-sm font-medium mb-1.5 text-body dark:text-paper">{label}</span>}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            if (!open) {
              e.preventDefault();
              setOpen(true);
            }
          }
        }}
        className="w-full h-11 rounded-[10px] border border-line dark:border-lineDark bg-white dark:bg-ink px-3.5 text-[15px] text-body dark:text-paper flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal"
      >
        <span className={selected ? '' : 'text-steel dark:text-steel'}>{selected?.label || placeholder || 'Select…'}</span>
        <ChevronDown size={16} className={`text-muted dark:text-mist transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              commit(highlight);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          autoFocus
          className="absolute z-40 mt-1 w-full max-h-60 overflow-auto rounded-[10px] border border-line dark:border-lineDark bg-white dark:bg-ink shadow-lift py-1"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => commit(i)}
              className={`flex items-center justify-between px-3.5 py-2.5 text-[15px] cursor-pointer ${
                i === highlight ? 'bg-sand dark:bg-ink' : ''
              } ${o.value === value ? 'text-teal font-medium' : 'text-body dark:text-paper'}`}
            >
              <span>
                {o.label}
                {o.hint && <span className="block text-xs text-muted dark:text-mist">{o.hint}</span>}
              </span>
              {o.value === value && <Check size={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
