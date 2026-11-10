import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MapPin,
  Bell,
  MonitorSmartphone,
  UserPlus,
  Trash2,
  Star,
  ShieldQuestion,
  KeyRound,
  Calculator,
  Check,
  ArrowRight,
  ArrowLeft,
  MonitorUp,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { PhoneField } from '../components/ui/PhoneField';
import { Select } from '../components/ui/Select';
import { Stepper, Badge, Toast } from '../components/ui/Bits';
import { useToast } from '../components/ui/useToast';
import { useShecurity } from '../app/shecurity-context';
import { setPins, updateUser, verifyPin } from '../app/auth';
import { RELATIONS } from '../lib/constants';
import { uid } from '../lib/format';
import type { Contact } from '../lib/types';
import { motion } from 'framer-motion';

const STEPS = ['Welcome', 'Permissions', 'Contacts', 'PINs', 'Calculator'];

export default function Onboarding() {
  const { user, onUserChanged } = useShecurity();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { toast, show } = useToast();

  // step 1: permissions
  const [micState, setMicState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [locState, setLocState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [notifState, setNotifState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const wakeLockSupported = useMemo(() => 'wakeLock' in navigator, []);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) return null;
  const u = user;

  const requestMic = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicState('granted');
      show('Microphone ready');
    } catch {
      setMicState('denied');
    }
  };
  const requestLoc = async () => {
    try {
      const p = await navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 8000 });
      void p;
      setLocState('granted');
      show('Location ready');
    } catch {
      setLocState('denied');
    }
  };
  const requestNotif = async () => {
    if (!('Notification' in window)) return setNotifState('denied');
    const res = await Notification.requestPermission();
    setNotifState(res === 'granted' ? 'granted' : 'denied');
  };

  return (
    <div className="dark min-h-screen bg-ink text-paper on-dark py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Stepper steps={STEPS} current={step} />
        </div>
        <div className="rounded-2xl border border-lineDark/50 bg-surface p-6 sm:p-8">
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                Welcome, {u.name.split(' ')[0]}. Here's what Shecurity does.
              </h1>
              <ul className="space-y-3 text-[15px] text-paper/85">
                <li className="flex gap-3">
                  <Mic className="text-teal-light shrink-0 mt-0.5" size={20} />
                  <span>
                    <strong>It listens on-device.</strong> Your phone's microphone watches for screams and distress
                    sounds using AI that runs entirely inside your browser. Audio never leaves your device.
                  </span>
                </li>
                <li className="flex gap-3">
                  <MonitorSmartphone className="text-teal-light shrink-0 mt-0.5" size={20} />
                  <span>
                    <strong>It hides as a calculator.</strong> Type your secret code and the safety dashboard appears.
                    Lock it any time.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Bell className="text-teal-light shrink-0 mt-0.5" size={20} />
                  <span>
                    <strong>It keeps the last 30 seconds.</strong> Like an aircraft black box, audio from before an
                    alert is saved as tamper-proof evidence.
                  </span>
                </li>
                <li className="flex gap-3">
                  <ShieldQuestion className="text-teal-light shrink-0 mt-0.5" size={20} />
                  <span>
                    <strong>It asks before alerting.</strong> One distress signal → "Are you safe?" prompt. Both signals
                    (scream + keyword) → instant alert. You choose a Real PIN and a Duress PIN.
                  </span>
                </li>
              </ul>
              <p className="mt-5 text-sm text-mist">
                Setup takes ~2 minutes. You can change everything later in Settings.
              </p>
            </motion.div>
          )}

          {/* STEP 1 — Permissions */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Permissions</h1>
              <p className="text-mist text-sm mb-4">Nothing is sent anywhere. These are device-only.</p>

              <div className="rounded-xl border border-lineDark/50 bg-ink/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Mic className="text-teal-light" size={20} />
                    <div>
                      <p className="font-medium">Microphone</p>
                      <p className="text-sm text-mist">Why: to detect screams on-device and record evidence clips.</p>
                    </div>
                  </div>
                  {micState === 'granted' ? (
                    <Badge tone="teal"><Check size={13} /> Allowed</Badge>
                  ) : micState === 'denied' ? (
                    <Badge tone="coral">Blocked</Badge>
                  ) : (
                    <Button size="sm" onClick={requestMic}>Allow</Button>
                  )}
                </div>
                {micState === 'denied' && (
                  <p className="mt-3 text-sm text-amber">
                    Blocked. Click the 🔒 / mic icon in your browser's address bar → set Microphone to "Allow", then
                    reload. Monitoring cannot start without it.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-lineDark/50 bg-ink/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-teal-light" size={20} />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-mist">Why: so trusted contacts get your live location in an alert.</p>
                    </div>
                  </div>
                  {locState === 'granted' ? (
                    <Badge tone="teal"><Check size={13} /> Allowed</Badge>
                  ) : locState === 'denied' ? (
                    <Badge tone="coral">Blocked</Badge>
                  ) : (
                    <Button size="sm" onClick={requestLoc}>Allow</Button>
                  )}
                </div>
                {locState === 'denied' && (
                  <p className="mt-3 text-sm text-amber">
                    Blocked. Browser settings → Location → Allow for this site. Alerts still work without it; messages
                    will say location unavailable.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-lineDark/50 bg-ink/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bell className="text-teal-light" size={20} />
                    <div>
                      <p className="font-medium">Notifications <span className="text-steel text-xs">(optional)</span></p>
                      <p className="text-sm text-mist">Why: gentle in-app reminders while sharing live location.</p>
                    </div>
                  </div>
                  {notifState === 'granted' ? (
                    <Badge tone="teal"><Check size={13} /> Allowed</Badge>
                  ) : notifState === 'denied' ? (
                    <Badge tone="neutral">Off</Badge>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={requestNotif}>Allow</Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-lineDark/50 bg-ink/40 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MonitorUp className="text-teal-light" size={20} />
                  <div>
                    <p className="font-medium">Screen Wake Lock</p>
                    <p className="text-sm text-mist">
                      {wakeLockSupported
                        ? 'Supported — the screen stays on while monitoring runs.'
                        : 'Not supported in this browser. Keep the screen on manually while monitoring.'}
                    </p>
                  </div>
                </div>
                <Badge tone={wakeLockSupported ? 'teal' : 'neutral'}>
                  {wakeLockSupported ? 'Available' : 'N/A'}
                </Badge>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Contacts */}
          {step === 2 && <ContactsStep u={u} onChange={(contacts) => onUserChanged({ ...u, contacts })} />}

          {/* STEP 3 — PINs */}
          {step === 3 && (
            <PinsStep
              u={u}
              onDone={() => {
                onUserChanged({ ...user });
                show('PINs saved (hashed)');
              }}
            />
          )}

          {/* STEP 4 — Calculator */}
          {step === 4 && (
            <CalculatorStep
              u={u}
              onDone={(code) => {
                const updated = { ...user, settings: { ...user.settings, unlockCode: code }, onboarded: true };
                updateUser(updated);
                onUserChanged(updated);
              }}
              onFinish={() => navigate('/dashboard')}
            />
          )}

          {/* nav buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                {step === 2 && u.contacts.length === 0 ? 'Skip for now' : 'Continue'} <ArrowRight size={16} />
              </Button>
            ) : (
              <span className="text-sm text-mist">Last step →</span>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}

/* ---------------- Contacts step ---------------- */
function ContactsStep({ u, onChange }: { u: import('../lib/types').StoredUser; onChange: (c: Contact[]) => void }) {
  const [contacts, setContacts] = useState<Contact[]>(u.contacts);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const add = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Enter a name.';
    if (phone.replace(/\D/g, '').length < 8) errs.phone = 'Enter a valid phone number.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const next = [...contacts, { id: uid(), name: name.trim(), relation, phone, email: email || undefined, primary: contacts.length === 0 }];
    setContacts(next);
    onChange(next);
    setName('');
    setRelation(RELATIONS[0]);
    setPhone('');
    setEmail('');
  };

  const remove = (id: string) => {
    const next = contacts.filter((c) => c.id !== id);
    if (next.length && !next.some((c) => c.primary)) next[0].primary = true;
    setContacts(next);
    onChange(next);
  };

  const makePrimary = (id: string) => {
    const next = contacts.map((c) => ({ ...c, primary: c.id === id }));
    setContacts(next);
    onChange(next);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Trusted contacts</h1>
      <p className="text-mist text-sm mb-5">
        Add 1–5 people who should be alerted. One is your <strong>primary</strong> contact.
      </p>

      {contacts.length > 0 && (
        <ul className="space-y-2 mb-5">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-lineDark/50 bg-ink/40 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal-light text-sm font-semibold">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {c.name} {c.primary && <Star size={13} className="inline text-amber fill-amber" />}
                  </p>
                  <p className="text-sm text-mist truncate">
                    {c.relation} · +{c.phone}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!c.primary && (
                  <button onClick={() => makePrimary(c.id)} aria-label={`Make ${c.name} primary`} className="p-2 rounded-lg hover:bg-white/10 text-mist hover:text-amber dark:hover:text-amber">
                    <Star size={16} />
                  </button>
                )}
                <button onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`} className="p-2 rounded-lg hover:bg-white/10 text-mist hover:text-coral-light">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {contacts.length < 5 ? (
        <div className="rounded-xl border border-dashed border-lineDark p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} icon={<UserPlus size={16} />} />
            <Select
              label="Relation"
              value={relation}
              onChange={setRelation}
              options={RELATIONS.map((r) => ({ value: r, label: r }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PhoneField label="Phone (WhatsApp)" value={phone} onChange={setPhone} error={errors.phone} />
            <Field label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          </div>
          <Button variant="ghost" onClick={add} icon={<UserPlus size={16} />}>
            Add contact
          </Button>
        </div>
      ) : (
        <p className="text-sm text-amber">Maximum of 5 contacts reached.</p>
      )}
    </motion.div>
  );
}

/* ---------------- PINs step ---------------- */
function PinsStep({ u, onDone }: { u: import('../lib/types').StoredUser; onDone: () => void }) {
  const [real1, setReal1] = useState('');
  const [real2, setReal2] = useState('');
  const [dur1, setDur1] = useState('');
  const [dur2, setDur2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmResult, setConfirmResult] = useState<string | null>(null);

  const save = async () => {
    const errs: Record<string, string> = {};
    const pinOk = (p: string) => /^\d{4}$/.test(p);
    if (!pinOk(real1)) errs.real = 'Real PIN must be exactly 4 digits.';
    if (real1 !== real2) errs.real2 = "PINs don't match.";
    if (!pinOk(dur1)) errs.dur = 'Duress PIN must be exactly 4 digits.';
    if (dur1 !== dur2) errs.dur2 = "PINs don't match.";
    if (pinOk(real1) && real1 === dur1) errs.dur = 'Duress PIN must be different from the Real PIN.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await setPins(u.id, real1, dur1);
    setSaving(false);
    // verify round-trip
    const a = await verifyPin(u.id, real1);
    const b = await verifyPin(u.id, dur1);
    if (a === 'real' && b === 'duress') {
      setConfirmResult('Both PINs verified ✓');
      onDone();
    } else {
      setConfirmResult('Unexpected verification result — please re-enter.');
    }
  };

  const pad = (value: string, setter: (v: string) => void) => (
    <div className="flex gap-2">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => {
            const v = value.split('');
            v[i] = e.target.value.replace(/\D/g, '');
            setter(v.join('').slice(0, 4));
            const next = (e.target as HTMLInputElement).nextElementSibling as HTMLInputElement | null;
            if (e.target.value && next) next.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i]) {
              const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement | null;
              prev?.focus();
            }
          }}
          className="h-14 w-14 rounded-xl border-2 border-lineDark bg-ink/50 text-center font-display text-2xl font-bold text-paper focus:border-teal focus:outline-none"
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Two PINs, two outcomes</h1>
      <p className="text-mist text-sm mb-5">
        When the alert countdown starts, you have 10 seconds to enter a PIN.
      </p>

      {/* diagram */}
      <svg viewBox="0 0 640 120" className="w-full mb-6 rounded-xl bg-ink/40 border border-lineDark/50" role="img" aria-label="Duress PIN flow diagram">
        <rect x="16" y="16" width="150" height="88" rx="10" fill="#D1495B" opacity="0.9" />
        <text x="91" y="55" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">ALERT starts</text>
        <text x="91" y="73" textAnchor="middle" fill="#fff" fontSize="11">(siren + countdown)</text>
        <path d="M166 60 H210" stroke="#5B6475" strokeWidth="2" markerEnd="url(#a1)" />
        <defs>
          <marker id="a1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#5B6475"/></marker>
        </defs>
        <rect x="210" y="16" width="190" height="40" rx="10" fill="#1F7A6D" />
        <text x="305" y="41" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">Real PIN → Cancel (safe)</text>
        <rect x="210" y="64" width="190" height="40" rx="10" fill="#E9A23B" />
        <text x="305" y="89" textAnchor="middle" fill="#14213D" fontSize="12" fontWeight="700">Duress PIN → "Cancelled"…</text>
        <path d="M400 84 H440" stroke="#5B6475" strokeWidth="2" markerEnd="url(#a2)" />
        <defs>
          <marker id="a2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#5B6475"/></marker>
        </defs>
        <rect x="440" y="64" width="184" height="40" rx="10" fill="#1F2E4D" stroke="#E9A23B" />
        <text x="532" y="82" textAnchor="middle" fill="#E9A23B" fontSize="11" fontWeight="700">…but alerts sent silently,</text>
        <text x="532" y="96" textAnchor="middle" fill="#E9A23B" fontSize="11" fontWeight="700">evidence + location shared</text>
      </svg>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-teal/30 bg-teal/10 p-4">
          <p className="font-medium mb-1 flex items-center gap-2"><KeyRound size={16} className="text-teal-light" /> Real PIN</p>
          <p className="text-sm text-mist mb-3">Cancels the alert for real. Use it when you're safe.</p>
          {pad(real1, setReal1)}
          <div className="mt-3">{pad(real2, setReal2)}</div>
          {errors.real && <p className="mt-2 text-sm text-coral-light">{errors.real}</p>}
          {errors.real2 && <p className="mt-2 text-sm text-coral-light">{errors.real2}</p>}
        </div>
        <div className="rounded-xl border border-amber/40 bg-amber/10 p-4">
          <p className="font-medium mb-1 flex items-center gap-2 text-amber"><ShieldQuestion size={16} /> Duress PIN</p>
          <p className="text-sm text-mist mb-3">
            Looks cancelled on screen, but alerts go out silently. Use it if someone forces you.
          </p>
          {pad(dur1, setDur1)}
          <div className="mt-3">{pad(dur2, setDur2)}</div>
          {errors.dur && <p className="mt-2 text-sm text-coral-light">{errors.dur}</p>}
          {errors.dur2 && <p className="mt-2 text-sm text-coral-light">{errors.dur2}</p>}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} loading={saving}>Save PINs</Button>
        {confirmResult && <span className={`text-sm ${confirmResult.includes('✓') ? 'text-teal-light' : 'text-coral-light'}`}>{confirmResult}</span>}
      </div>
    </motion.div>
  );
}

/* ---------------- Calculator step ---------------- */
function CalculatorStep({
  u,
  onDone,
  onFinish,
}: {
  u: import('../lib/types').StoredUser;
  onDone: (code: string) => void;
  onFinish: () => void;
}) {
  const current = u.settings.unlockCode || '1234=';
  const [digits, setDigits] = useState(current.replace('=', ''));
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const code = digits + '=';
  const save = () => {
    if (!/^\d{3,8}$/.test(digits)) return;
    onDone(code);
    setSaved(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Calculator disguise</h1>
      <p className="text-mist text-sm mb-5">
        On the calculator screen, typing this secret code and pressing <strong>=</strong> opens your dashboard. Wrong
        codes just do normal math — no hint, no error.
      </p>
      <div className="rounded-xl border border-lineDark/50 bg-ink/40 p-4 mb-4">
        <p className="font-medium mb-3 flex items-center gap-2"><Calculator size={17} className="text-teal-light" /> Secret unlock code</p>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={digits}
            onChange={(e) => {
              setDigits(e.target.value.replace(/\D/g, '').slice(0, 8));
              setSaved(false);
            }}
            className="h-12 w-40 rounded-xl border-2 border-lineDark bg-surface text-center font-display text-xl font-bold tracking-[0.3em] text-paper focus:border-teal focus:outline-none"
            aria-label="Unlock code digits"
          />
          <span className="font-display text-xl text-mist">=</span>
          <Button variant="ghost" size="sm" onClick={save} className="ml-2">
            {saved ? <Check size={15} /> : 'Save'}
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => setPreview((p) => !p)}>
            {preview ? 'Hide' : 'Show'} preview
          </Button>
          <span className="text-sm text-mist">Code: {saved ? code : `${current}`}</span>
        </div>
        {preview && (
          <div className="mt-4 rounded-2xl border border-lineDark/50 bg-surface p-4 max-w-[260px]">
            <div className="rounded-lg bg-ink p-3 text-right font-display text-2xl mb-3">{code}</div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm text-paper/80">
              {['1','2','3','×','4','5','6','−','7','8','9','+'].map((k) => (
                <div key={k} className="rounded-lg bg-white/5 py-2">{k}</div>
              ))}
              <div className="col-span-3 rounded-lg bg-white/5 py-2">0</div>
              <div className="rounded-lg bg-teal py-2 text-white font-bold">=</div>
            </div>
            <p className="mt-3 text-xs text-mist">Type {code} anywhere on the keypad → dashboard opens.</p>
          </div>
        )}
      </div>
      <Button onClick={onFinish} icon={<Check size={16} />}>
        Finish setup — open Dashboard
      </Button>
    </motion.div>
  );
}
