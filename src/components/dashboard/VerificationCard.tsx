import { useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Siren, Hand } from 'lucide-react';
import { Badge, ProgressBar } from '../ui/Bits';
import { useShecurity } from '../../app/shecurity-context';
import { getHistory } from '../../engine/storage/localStore';
import type { AlertHistoryEntry } from '../../lib/types';

// Dual-verification card: Sound chip + Words chip + combined confidence
export function VerificationCard() {
  const { verification, keyword, monitoring } = useShecurity();
  const conf = verification.confidence;

  return (
    <div className="rounded-2xl border border-lineDark/50 bg-surface p-5">
      <p className="font-semibold flex items-center gap-2">
        <ShieldCheck size={17} className="text-teal-light" /> Dual verification
      </p>
      <p className="mt-1 text-sm text-mist">
        Two independent signals must agree. Both within 8 s → instant alert (95%+). One signal → "Are you safe?" prompt.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Chip active={verification.sound} label="Sound" ok={verification.sound} />
        <span className="text-mist text-xs font-semibold">+</span>
        <Chip active={verification.words} label="Words" ok={verification.words} />
        <span className="ml-auto text-right">
          <span className="block font-display text-2xl font-bold" data-testid="confidence">
            {conf}%
          </span>
          <span className="block text-[11px] text-mist -mt-1">confidence</span>
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar
          value={conf}
          tone={conf >= 90 ? 'coral' : conf >= 55 ? 'amber' : 'teal'}
        />
      </div>
      {keyword.supported ? (
        keyword.enabled ? (
          <p className="mt-3 text-xs text-mist">
            Keywords ON ({keyword.running ? 'listening' : 'not running'}) · lang toggle in Settings · last heard:{' '}
            <span className="italic">{keyword.lastHeard ? `"${keyword.lastHeard}"` : '—'}</span>
            {keyword.lastHit && <strong className="text-amber"> · match: "{keyword.lastHit}"</strong>}
          </p>
        ) : (
          <p className="mt-3 text-xs text-mist">
            Keywords OFF — enable in Settings to add word detection (uses browser speech service, disclosed).
          </p>
        )
      ) : (
        <p className="mt-3 text-xs text-mist">
          Keyword detection unsupported in this browser — scream detection alone.
        </p>
      )}
      {!monitoring && <p className="mt-2 text-xs text-steel">Turn monitoring ON to activate verification.</p>}
    </div>
  );
}

function Chip({ active, label }: { active: boolean; label: string; ok?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'border-coral-light/60 bg-coral-light/15 text-coral-light' : 'border-lineDark bg-ink/60 text-mist'
      }`}
      aria-live="polite"
    >
      {active ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
      {label} {active ? '✓' : '✖'}
    </span>
  );
}

// Alert history table
export function AlertsTable() {
  const [rows] = useState<AlertHistoryEntry[]>(() => getHistory());

  return (
    <div className="rounded-2xl border border-lineDark/50 bg-surface p-5">
      <p className="font-semibold flex items-center gap-2">
        <Siren size={17} className="text-coral-light" /> Alert history
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-mist">No alerts yet. Everything logged here stays on this device.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium capitalize">{r.trigger}</span>
                <span className="block text-xs text-mist">{new Date(r.at).toLocaleString()}</span>
              </span>
              <Badge
                tone={
                  r.outcome === 'silent-duress' ? 'amber' : r.outcome === 'proceeded' ? 'coral' : 'teal'
                }
              >
                {r.outcome === 'silent-duress'
                  ? '🤐 silent (duress)'
                  : r.outcome === 'proceeded'
                    ? 'alert sent'
                    : 'cancelled'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Big SOS hold button with progress ring
export function SosButton() {
  const { triggerAlert } = useShecurity();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const HOLD_MS = 1500;

  const begin = () => {
    startRef.current = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - startRef.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        cancel();
        triggerAlert('manual');
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const cancel = () => {
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
  };

  return (
    <button
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative mx-auto flex h-28 w-28 select-none items-center justify-center rounded-full bg-coral text-white font-display text-xl font-bold shadow-lift transition active:scale-95"
      aria-label="Hold for one and a half seconds to send SOS"
      data-testid="sos-button"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
        <circle
          cx="56"
          cy="56"
          r="52"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 52}`}
          strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
        />
      </svg>
      <span className="relative flex items-center gap-2">
        <Hand size={22} /> SOS
      </span>
    </button>
  );
}
