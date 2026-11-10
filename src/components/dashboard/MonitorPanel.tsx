import { useState } from 'react';
import { Play, Square, Volume2, Info } from 'lucide-react';
import { Badge, Toggle } from '../ui/Bits';
import { useShecurity } from '../../app/shecurity-context';
import { formatDuration } from '../../lib/format';

export function MonitorSwitch() {
  const { monitoring, setMonitoring, uptime, worklet, modelState } = useShecurity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = async (on: boolean) => {
    setBusy(true);
    setError('');
    try {
      await setMonitoring(on);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start monitoring');
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-lineDark/50 bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">Monitoring</p>
          <p className="text-sm text-mist">
            {monitoring ? `Listening · ${formatDuration(uptime)}` : 'Turn on to detect distress sounds'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={monitoring ? 'teal' : 'neutral'}>{monitoring ? 'ON' : 'OFF'}</Badge>
            <Badge tone="neutral">{worklet ? 'AudioWorklet' : 'ScriptProcessor'}</Badge>
            <Badge tone={modelState === 'ready' ? 'teal' : modelState === 'error' ? 'coral' : 'amber'}>
              {modelState === 'ready' ? 'YAMNet ready' : modelState === 'loading' ? 'Preparing AI…' : modelState === 'error' ? 'Model error' : 'Model idle'}
            </Badge>
          </div>
        </div>
        <Toggle checked={monitoring} onChange={toggle} disabled={busy} danger label="Monitoring" />
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-coral-light/15 border border-coral-light/40 px-3 py-2 text-sm text-coral-light" role="alert">
          {error} Open the 🔒 icon in the address bar → Microphone → Allow, then try again.
        </p>
      )}
    </div>
  );
}

export function TestSoundPanel() {
  const { testSound, monitoring } = useShecurity();
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const audio = new Audio('/sounds/sample-scream.wav');
    audio.volume = 1;
    audio.onended = () => setPlaying(false);
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    testSound();
  };

  return (
    <div className="rounded-2xl border border-lineDark/50 bg-surface p-5">
      <p className="font-semibold flex items-center gap-2">
        <Volume2 size={17} className="text-teal-light" /> Test with sound
      </p>
      <p className="mt-1 text-sm text-mist">
        Play the bundled sample (≈2.5 s) through your speakers with monitoring ON — the danger meter should rise into
        the Watch/Danger zone. No need to make noise yourself.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={play}
          disabled={playing}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-teal px-5 text-[15px] font-medium text-white hover:bg-teal-hover active:scale-[0.98] transition disabled:opacity-60"
        >
          {playing ? <Square size={16} /> : <Play size={16} />}
          {playing ? 'Playing…' : 'Play scream sample'}
        </button>
        {!monitoring && (
          <span className="text-xs text-amber">Turn monitoring ON first</span>
        )}
      </div>
      <p className="mt-3 text-xs text-steel flex gap-1.5">
        <Info size={13} className="mt-0.5 shrink-0" />
        You can also play any scream video near the mic (YouTube "scream sound effect") — same effect. Sample: synthetic
        sweep generated for Shecurity, see public/sounds/CREDITS.md.
      </p>
    </div>
  );
}
