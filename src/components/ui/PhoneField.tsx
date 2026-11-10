import { Phone } from 'lucide-react';
import { COUNTRY_CODES } from '../../lib/constants';
import { Select } from './Select';

interface PhoneFieldProps {
  label: string;
  value: string; // stored as "919876543210" (with country code digits, no +)
  onChange: (v: string) => void;
  error?: string;
  helper?: string;
}

export function PhoneField({ label, value, onChange, error, helper }: PhoneFieldProps) {
  // split stored value into code + national number
  const matched = COUNTRY_CODES.find((c) => value.startsWith(c.code.slice(1)));
  const code = matched?.code || '+91';
  const national = value.startsWith(code.slice(1)) ? value.slice(code.length - 1) : value;

  return (
    <div className="w-full">
      <span className="block text-sm font-medium mb-1.5 text-body dark:text-paper">{label}</span>
      <div className="flex gap-2">
        <div className="w-[7.5rem] shrink-0">
          <Select
            value={code}
            options={COUNTRY_CODES.map((c) => ({ value: c.code, label: `${c.flag} ${c.code}` }))}
            onChange={(v) => onChange(v.slice(1) + national.replace(/\D/g, ''))}
          />
        </div>
        <div className="relative flex-1">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="tel"
            inputMode="numeric"
            value={national}
            onChange={(e) => onChange(code.slice(1) + e.target.value.replace(/\D/g, ''))}
            placeholder="98765 43210"
            className={`w-full h-11 rounded-[10px] border bg-white dark:bg-ink pl-9 pr-3.5 text-[15px] text-body dark:text-paper border-line dark:border-lineDark focus:outline-none focus:ring-2 focus:ring-teal ${
              error ? 'border-coral' : ''
            }`}
            aria-invalid={Boolean(error)}
          />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-coral dark:text-coral-light" role="alert">
          {error}
        </p>
      )}
      {!error && helper && <p className="mt-1.5 text-sm text-muted dark:text-mist">{helper}</p>}
    </div>
  );
}
