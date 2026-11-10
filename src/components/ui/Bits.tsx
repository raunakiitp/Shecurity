import type { ReactNode } from 'react';
import { X } from 'lucide-react';

// ---------- Toggle ----------
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  danger?: boolean;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, danger, disabled, id }: ToggleProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
        checked ? (danger ? 'bg-coral' : 'bg-teal') : 'bg-slate-300 dark:bg-lineDark'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ---------- Badge ----------
type BadgeTone = 'teal' | 'coral' | 'amber' | 'neutral' | 'dark';
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    // dark-surface variants: AA-passing foregrounds (teal-light #3FBFAE, coral-light #F2A0AB, amber #E9A23B)
    teal: 'bg-teal/15 text-teal border-teal/30 dark:bg-teal-light/15 dark:text-teal-light dark:border-teal-light/40',
    coral: 'bg-coral/10 text-coral border-coral/30 dark:bg-coral-light/10 dark:text-coral-light dark:border-coral-light/40',
    amber: 'bg-amber/15 text-amber-700 border-amber/40 dark:bg-amber/15 dark:text-amber dark:border-amber/50',
    neutral: 'bg-sand text-muted border-line dark:bg-surface dark:text-mist dark:border-lineDark',
    dark: 'bg-ink text-paper border-ink',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ---------- Modal ----------
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-paper dark:bg-surface border border-line dark:border-lineDark shadow-lift p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-body dark:text-paper">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 rounded-md text-muted hover:text-body dark:text-mist dark:hover:text-paper">
            <X size={20} />
          </button>
        </div>
        <div className="text-[15px] text-body dark:text-paper">{children}</div>
        {actions && <div className="mt-6 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// ---------- Toast ----------
export function Toast({ message, tone = 'teal' }: { message: string; tone?: 'teal' | 'coral' }) {
  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-full px-5 py-2.5 text-sm font-semibold shadow-lift ${
        tone === 'teal' ? 'bg-teal text-white' : 'bg-coral-light text-ink'
      }`}
    >
      {message}
    </div>
  );
}

// ---------- Tooltip ----------
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-paper opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {text}
      </span>
    </span>
  );
}

// ---------- ProgressBar ----------
export function ProgressBar({ value, tone = 'teal', label }: { value: number; tone?: 'teal' | 'coral' | 'amber'; label?: string }) {
  const colors = { teal: 'bg-teal', coral: 'bg-coral', amber: 'bg-amber' };
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-muted dark:text-mist mb-1"><span>{label}</span><span>{Math.round(value)}%</span></div>}
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-ink overflow-hidden" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all duration-300 ${colors[tone]}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

// ---------- Stepper ----------
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center w-full" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors ${
                i < current
                  ? 'bg-teal border-teal text-white'
                  : i === current
                    ? 'border-teal text-teal bg-teal/10 dark:text-teal-light'
                    : 'border-lineDark text-mist'
              }`}
              aria-current={i === current ? 'step' : undefined}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className={`mt-1.5 text-[11px] sm:text-xs ${i === current ? 'text-teal dark:text-teal-light font-medium' : 'text-muted dark:text-mist'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < current ? 'bg-teal' : 'bg-line dark:bg-lineDark'}`} />}
        </li>
      ))}
    </ol>
  );
}

// ---------- Tabs ----------
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl bg-sand dark:bg-ink p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            active === t.id ? 'bg-white dark:bg-surface text-body dark:text-paper shadow-soft' : 'text-muted hover:text-body dark:text-mist dark:hover:text-paper'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
