import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string;
  icon?: ReactNode;
}

export function Field({ label, helper, error, icon, className = '', type, ...rest }: FieldProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && show ? 'text' : type;
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium mb-1.5 text-body dark:text-paper">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">{icon}</span>
        )}
        <input
          id={id}
          type={actualType}
          className={`w-full h-11 rounded-[10px] border bg-white dark:bg-ink px-3.5 text-[15px] text-body dark:text-paper dark:placeholder:text-steel border-line dark:border-lineDark focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal transition ${
            error ? 'border-coral ring-1 ring-coral' : ''
          } ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-body dark:text-mist dark:hover:text-paper rounded-md"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-coral dark:text-coral-light" role="alert">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${id}-helper`} className="mt-1.5 text-sm text-muted dark:text-mist">
          {helper}
        </p>
      )}
    </div>
  );
}

