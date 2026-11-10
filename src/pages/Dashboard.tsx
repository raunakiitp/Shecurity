import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useShecurity } from '../app/shecurity-context';
import { DangerMeter, WaveformCanvas } from '../components/dashboard/DangerMeter';
import { MonitorSwitch, TestSoundPanel } from '../components/dashboard/MonitorPanel';
import { VerificationCard, AlertsTable, SosButton } from '../components/dashboard/VerificationCard';
import { Badge } from '../components/ui/Bits';
import { detectionZone } from '../lib/zone';

export default function Dashboard() {
  const {
    monitoring,
    score,
    top3,
    levels,
    modelState,
    modelError,
    setMonitoring,
    recordingLeft,
    alertPhase,
  } = useShecurity();
  const navigate = useNavigate();
  const location = useLocation();

  // double-tap on title → panic return to calculator
  useEffect(() => {
    const el = document.getElementById('dashboard-title');
    if (!el) return;
    let last = 0;
    const handler = () => {
      const now = Date.now();
      if (now - last < 400) navigate('/calculator');
      last = now;
    };
    el.addEventListener('dblclick', handler);
    el.addEventListener('touchend', handler);
    return () => {
      el.removeEventListener('dblclick', handler);
      el.removeEventListener('touchend', handler);
    };
  }, [navigate]);

  // alert redirect
  useEffect(() => {
    if (alertPhase === 'countdown' || alertPhase === 'prompt') {
      navigate('/alert', { state: { from: location.pathname } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertPhase]);

  const zone = detectionZone(score);
  const unlocked = (location.state as { unlocked?: boolean } | null)?.unlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {unlocked && (
        <p className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-2.5 text-sm text-teal-light">
          Unlocked. You're in the hidden dashboard — press <strong>Lock</strong> (top right) to return to the
          calculator instantly.
        </p>
      )}

      {modelState === 'loading' && (
        <div className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber" role="status">
          Preparing on-device AI… (first load takes a few seconds; then it's cached)
        </div>
      )}
      {modelState === 'error' && (
        <div className="rounded-xl border border-coral-light/40 bg-coral-light/10 px-4 py-3 text-sm text-coral-light" role="alert">
          Couldn't load the YAMNet model ({modelError}). Monitoring is disabled — check your connection and reload.
        </div>
      )}
      {recordingLeft !== null && (
        <div className="rounded-xl border border-coral-light/40 bg-coral-light/15 px-4 py-3 text-sm text-coral-light font-medium" role="status">
          Recording evidence… {Math.ceil(recordingLeft)}s left (30s pre-roll already captured)
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* left: meter + waveform + monitoring */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-lineDark/50 bg-surface p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Live danger meter</h2>
              <Badge tone={zone === 'safe' ? 'teal' : zone === 'watch' ? 'amber' : 'coral'}>
                {zone === 'safe' ? 'Safe 0–30' : zone === 'watch' ? 'Watch 31–60' : 'Danger 61–100'}
              </Badge>
            </div>
            <DangerMeter score={monitoring ? score : 0} zone={zone} />
            <div className="mt-4">
              <WaveformCanvas levels={levels} zone={zone} />
            </div>
            <div className="mt-4 grid gap-2">
              {top3.length === 0 && (
                <p className="text-sm text-mist">
                  {monitoring ? 'Waiting for sound…' : 'Top detected sounds appear here while monitoring.'}
                </p>
              )}
              {top3.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="w-40 sm:w-52 truncate text-sm text-paper/80">{t.name}</span>
                  <div className="h-2 flex-1 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${zone === 'danger' ? 'bg-coral' : 'bg-teal-light'}`}
                      style={{ width: `${Math.round(t.score * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-mist">{Math.round(t.score * 100)}%</span>
                </div>
              ))}
            </div>
            {!monitoring && (
              <button
                onClick={() => setMonitoring(true)}
                className="mt-4 text-sm text-teal-light hover:underline"
              >
                Turn on monitoring now →
              </button>
            )}
          </div>

          <MonitorSwitch />
          <TestSoundPanel />
        </div>

        {/* right: verification + SOS + info */}
        <div className="space-y-5">
          <VerificationCard />
          <div className="rounded-2xl border border-lineDark/50 bg-surface p-5 text-center">
            <p className="font-semibold mb-3">Manual SOS</p>
            <SosButton />
            <p className="mt-3 text-xs text-mist">Hold 1.5 s to trigger. Also: shake phone ×3, triple-tap calculator display, Shift×3.</p>
          </div>
          <div className="rounded-2xl border border-lineDark/50 bg-surface p-5">
            <p className="font-semibold flex items-center gap-2">
              <Info size={16} className="text-teal-light" /> Privacy, in one line
            </p>
            <p className="mt-2 text-sm text-mist">
              All audio is processed on your device. Nothing is uploaded — except the optional keyword feature, which
              uses your browser's speech service and is off by default.
            </p>
          </div>
          <AlertsTable />
        </div>
      </div>
    </motion.div>
  );
}
