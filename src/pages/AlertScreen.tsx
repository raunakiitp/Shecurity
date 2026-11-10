import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Delete, MapPin, Send, ShieldCheck, Users, Volume2, VolumeX, RefreshCw, Copy } from 'lucide-react';
import { useShecurity } from '../app/shecurity-context';
import { Button } from '../components/ui/Button';
import type { Contact } from '../lib/types';
import {
  buildMessage,
  whatsappLink,
  smsLink,
  webShare,
  copyText,
  telLink,
} from '../engine/location/share';
import { EMERGENCY_NUMBERS } from '../lib/constants';
import { mapsLink } from '../lib/format';

export default function AlertScreen() {
  const navigate = useNavigate();
  const {
    user,
    settings,
    alertPhase,
    promptDeadline,
    countdownEnd,
    submitPin,
    answerSafe,
    dismissAlertUI,
    sendLocationUpdate,
    location,
    recordingLeft,
    verification,
  } = useShecurity();

  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [muted, setMuted] = useState(!settings?.siren);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // redirect home when idle
  useEffect(() => {
    if (alertPhase === 'idle') navigate('/dashboard', { replace: true });
  }, [alertPhase, navigate]);

  // default all contacts selected
  useEffect(() => {
    if (user && Object.keys(selected).length === 0 && user.contacts.length) {
      const all: Record<string, boolean> = {};
      user.contacts.forEach((c: Contact) => (all[c.id] = true));
      setSelected(all);
    }
  }, [user, selected]);

  const message = useMemo(
    () => buildMessage(user?.name ?? 'Shecurity user', location, new Date().toLocaleTimeString()),
    [user, location],
  );

  const secondsLeft = countdownEnd ? Math.max(0, Math.ceil((countdownEnd - Date.now()) / 1000)) : null;
  const promptLeft = promptDeadline ? Math.max(0, Math.ceil((promptDeadline - Date.now()) / 1000)) : null;

  const pressDigit = (d: string) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      submitPin(next).then((res: 'real' | 'duress' | 'none') => {
        if (res === 'none') {
          setShake(true);
          setAttempts((a) => a + 1);
          setTimeout(() => {
            setShake(false);
            setPin('');
          }, 450);
        } else {
          setPin('');
        }
      });
    }
  };

  const shareNext = async () => {
    const next = user?.contacts.find((c: Contact) => selected[c.id]);
    if (!next) return;
    window.open(whatsappLink(next.phone, message), '_blank');
    setSelected((s) => ({ ...s, [next.id]: false }));
  };

  /* ---------------- PROMPT (Are you safe?) ---------------- */
  if (alertPhase === 'prompt') {
    return (
      <div className="dark min-h-screen bg-ink text-paper flex flex-col items-center justify-center p-6 on-dark">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber/15 border-2 border-amber">
            <ShieldCheck className="text-amber" size={44} />
          </div>
          <h1 className="font-display text-3xl font-bold">Are you safe?</h1>
          <p className="mt-3 text-mist">
            We detected a {verification.sound && verification.words ? 'distress pattern' : 'possible distress signal'}.
            If you're safe, tap below. No answer in {promptLeft ?? 15}s starts the alert.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                answerSafe();
                navigate('/dashboard', { replace: true });
              }}
              className="h-14 rounded-2xl bg-teal font-semibold text-white text-lg hover:bg-teal-hover active:scale-[0.98] transition"
            >
              I'm safe — cancel
            </button>
            <button
              onClick={() => {
                answerSafe();
                navigate('/dashboard', { replace: true });
              }}
              className="text-sm text-mist hover:text-paper"
            >
              It's nothing (dismiss)
            </button>
          </div>
          <p className="mt-6 text-xs text-mist">Confidence: {verification.confidence}%</p>
        </motion.div>
      </div>
    );
  }

  /* ---------------- COUNTDOWN ---------------- */
  if (alertPhase === 'countdown') {
    const frac = countdownEnd ? (countdownEnd - Date.now()) / 10000 : 0;
    return (
      <div className="dark min-h-screen bg-coral text-white flex flex-col items-center justify-center p-6 on-dark">
        <div className="relative h-56 w-56">
          <svg viewBox="0 0 224 224" className="h-full w-full -rotate-90">
            <circle cx="112" cy="112" r="100" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="#fff"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - Math.max(0, frac))}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-7xl font-bold" data-testid="countdown-seconds">{secondsLeft ?? 10}</span>
            <span className="text-sm font-medium text-white" style={{ opacity: 1 }}>seconds</span>
          </div>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Alert in progress</h1>
        <p className="mt-1 text-center max-w-sm text-white" style={{ opacity: 1 }}>
          Enter your <strong>Real PIN</strong> to cancel, or <strong>Duress PIN</strong> to fake-cancel and silently
          send alerts. No input → alert sends at 0.
        </p>

        <div className={`mt-8 ${shake ? 'animate-shake' : ''}`}>
          <div className="flex gap-3 justify-center mb-6">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-4 w-4 rounded-full border-2 border-white/70 bg-white/20">
                {pin[i] && <span className="block h-full w-full rounded-full bg-white" />}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                onClick={() => pressDigit(d)}
                className="h-16 w-16 rounded-2xl bg-white/15 text-2xl font-semibold hover:bg-white/25 active:scale-95 transition backdrop-blur"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setMuted((m) => !m)}
              className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center active:scale-95 transition"
              aria-label={muted ? 'Unmute siren' : 'Mute siren'}
            >
              {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
            <button
              onClick={() => pressDigit('0')}
              className="h-16 w-16 rounded-2xl bg-white/15 text-2xl font-semibold hover:bg-white/25 active:scale-95 transition"
            >
              0
            </button>
            <button
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center active:scale-95 transition"
              aria-label="Delete digit"
            >
              <Delete size={20} />
            </button>
          </div>
        </div>
        {attempts > 0 && <p className="mt-4 text-sm font-medium text-white">Wrong PIN — {attempts} attempt(s). Siren continues.</p>}
        <div className="mt-8 flex gap-2 text-xs font-semibold text-white">
          <a href={telLink('112')} className="rounded-full bg-white/15 px-4 py-2">📞 112</a>
          <a href={telLink('1091')} className="rounded-full bg-white/15 px-4 py-2">📞 1091</a>
        </div>
      </div>
    );
  }

  /* ---------------- RECORDING / SHARING ---------------- */
  if (alertPhase === 'recording' || alertPhase === 'sharing') {
    return (
      <div className="dark min-h-screen bg-teal text-white flex flex-col items-center p-6 on-dark">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
            <Check size={40} />
          </div>
          <h1 className="text-center font-display text-3xl font-bold">Alert cancelled</h1>
          <p className="mt-2 text-center font-medium text-white">You're marked safe. Nothing was sent.</p>

          {recordingLeft !== null && (
            <p className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-center text-sm" role="status">
              Finishing evidence recording… {Math.ceil(recordingLeft)}s
            </p>
          )}

          <div className="mt-8 rounded-2xl bg-white/10 p-5">
            <p className="font-semibold flex items-center gap-2">
              <Users size={17} /> Send to trusted contacts
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              Browsers require one tap per send. Select contacts, then step through with "Next contact".
            </p>
            <ul className="mt-3 space-y-2">
              {user?.contacts.map((c: Contact) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                  <label className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected[c.id] ?? true}
                      onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))}
                      className="h-4 w-4 accent-white"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{c.name}</span>
                      <span className="block text-xs font-medium text-white truncate">+{c.phone}</span>
                    </span>
                  </label>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href={whatsappLink(c.phone, message)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium hover:bg-white/25"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={smsLink(c.phone, message)}
                      className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium hover:bg-white/25"
                    >
                      SMS
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="ghost" className="!text-white !border-white/40" onClick={shareNext}>
                <Send size={15} /> Next contact
              </Button>
              <Button
                variant="ghost"
                className="!text-white !border-white/40"
                onClick={async () => {
                  const ok = await copyText(message);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                <Copy size={15} /> {copied ? 'Copied!' : 'Copy message'}
              </Button>
              {typeof navigator.share === 'function' && (
                <Button
                  variant="ghost"
                  className="!text-white !border-white/40"
                  onClick={() => webShare(message)}
                >
                  <Send size={15} /> Share…
                </Button>
              )}
              <Button variant="ghost" className="!text-white !border-white/40" onClick={() => sendLocationUpdate()}>
                <RefreshCw size={15} /> Send location update
              </Button>
            </div>
            {location && (
              <p className="mt-3 text-xs font-medium text-white flex items-center gap-1.5">
                <MapPin size={13} /> Live: {location.lat.toFixed(5)}, {location.lng.toFixed(5)} (±
                {Math.round(location.accuracy)}m) ·{' '}
                <a href={mapsLink(location.lat, location.lng)} target="_blank" rel="noreferrer" className="underline">
                  open map
                </a>
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {EMERGENCY_NUMBERS.map((n) => (
              <a
                key={n.number}
                href={telLink(n.number)}
                className="rounded-xl bg-white/15 py-3 text-center text-xs font-bold text-white hover:bg-white/25"
              >
                {n.label.split(' ')[0]}
                <span className="block text-lg">{n.number}</span>
              </a>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                dismissAlertUI();
                navigate('/dashboard', { replace: true });
              }}
              className="rounded-full bg-white px-6 py-2.5 font-semibold text-teal hover:bg-white/90 active:scale-[0.98] transition"
            >
              Done — back to dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------------- fallback ---------------- */
  return (
    <div className="dark min-h-screen bg-ink text-paper grid place-items-center on-dark">
      <p className="text-mist">Nothing in progress.</p>
    </div>
  );
}
