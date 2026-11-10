import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, BatteryWarning, Bell, Languages } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Select } from '../components/ui/Select';
import { Toggle, Badge, Toast } from '../components/ui/Bits';
import { useToast } from '../components/ui/useToast';
import { useShecurity } from '../app/shecurity-context';
import { updateUser, setPins } from '../app/auth';
import type { Sensitivity } from '../lib/types';

export default function Settings() {
  const { user, onUserChanged, settings } = useShecurity();
  const navigate = useNavigate();
  const { toast, show } = useToast();
  const [unlock, setUnlock] = useState(user?.settings.unlockCode ?? '1234=');
  const [realPin, setRealPin] = useState('');
  const [duressPin, setDuressPin] = useState('');

  if (!user || !settings) return null;

  const save = (patch: Partial<typeof user.settings>) => {
    const updated = { ...user, settings: { ...user.settings, ...patch } };
    updateUser(updated);
    onUserChanged(updated);
  };

  const changePins = async () => {
    if (!/^\d{4}$/.test(realPin) || !/^\d{4}$/.test(duressPin)) {
      show('Both PINs must be 4 digits', 'coral');
      return;
    }
    if (realPin === duressPin) {
      show('Duress PIN must differ from the Real PIN', 'coral');
      return;
    }
    await setPins(user.id, realPin, duressPin);
    setRealPin('');
    setDuressPin('');
    show('PINs updated (PBKDF2-hashed)');
  };

  const saveUnlock = () => {
    if (!/^\d{3,8}=$/.test(unlock)) {
      show('Code must be 3-8 digits ending with =', 'coral');
      return;
    }
    save({ unlockCode: unlock });
    show('Unlock code saved');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      {/* detection */}
      <section className="rounded-2xl border border-lineDark/50 bg-surface p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Bell size={17} className="text-teal-light" /> Detection</h2>
        <div>
          <p className="text-sm font-medium mb-2">Sensitivity</p>
          <Select
            value={settings.sensitivity}
            onChange={(v) => save({ sensitivity: v as Sensitivity })}
            options={[
              { value: 'low', label: 'Low', hint: 'threshold 0.60 — only clear screams' },
              { value: 'medium', label: 'Medium (recommended)', hint: 'threshold 0.45' },
              { value: 'high', label: 'High', hint: 'threshold 0.30 — more sensitive, more false alarms' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Keyword detection</p>
            <p className="text-xs text-mist mt-0.5 max-w-md">
              <strong className="text-amber">Disclosure:</strong> scream detection is fully on-device. Keyword detection
              uses your browser's speech service (in Chrome, audio is processed by Google's cloud speech service). It is
              optional and off by default.
            </p>
          </div>
          <Toggle checked={settings.keywords} onChange={(v) => save({ keywords: v })} disabled={!keywordSupported()} label="Keyword detection" />
        </div>
        {settings.keywords && (
          <div className="w-48">
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Languages size={15} /> Language</p>
            <Select
              value={settings.lang}
              onChange={(v) => save({ lang: v as 'hi-IN' | 'en-IN' })}
              options={[
                { value: 'hi-IN', label: 'हिन्दी (hi-IN)' },
                { value: 'en-IN', label: 'English (en-IN)' },
              ]}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Siren during countdown</p>
          <Toggle checked={settings.siren} onChange={(v) => save({ siren: v })} label="Siren" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Vibration (Android)</p>
          <Toggle checked={settings.vibration} onChange={(v) => save({ vibration: v })} label="Vibration" />
        </div>
      </section>

      {/* pins */}
      <section className="rounded-2xl border border-lineDark/50 bg-surface p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><KeyRound size={17} className="text-teal-light" /> PINs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="New Real PIN (cancels)" value={realPin} onChange={(e) => setRealPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 digits" inputMode="numeric" />
          <Field label="New Duress PIN (silent alert)" value={duressPin} onChange={(e) => setDuressPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 digits" inputMode="numeric" />
        </div>
        <Button variant="ghost" onClick={changePins}>Update PINs</Button>
      </section>

      {/* unlock code */}
      <section className="rounded-2xl border border-lineDark/50 bg-surface p-5 space-y-3">
        <h2 className="font-semibold">Calculator unlock code</h2>
        <div className="flex gap-2 max-w-xs">
          <Field label="Code (digits + =)" value={unlock} onChange={(e) => setUnlock(e.target.value.replace(/[^0-9=]/g, '').slice(0, 9))} />
        </div>
        <Button variant="ghost" onClick={saveUnlock}>Save code</Button>
      </section>

      {/* power button honesty card */}
      <section className="rounded-2xl border border-amber/30 bg-amber/10 p-5">
        <h2 className="font-semibold flex items-center gap-2 text-amber"><BatteryWarning size={17} /> Hardware limitations (honest answer)</h2>
        <p className="mt-2 text-sm text-mist">
          A web app <strong>cannot</strong> detect the hardware power button, and it cannot run with the screen off.
          Monitoring stops if the tab is closed. The planned <strong>native Android version</strong> will support the
          triple power-press trigger and background operation. We refuse to fake this feature.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="amber">No power-button trigger (web)</Badge>
          <Badge tone="amber">No screen-off operation (web)</Badge>
          <Badge tone="neutral">Wake Lock keeps screen on</Badge>
        </div>
      </section>

      <Button variant="ghost" onClick={() => navigate('/dashboard')}>← Back to dashboard</Button>
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}

function keywordSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
