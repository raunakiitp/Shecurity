import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Copy,
  FileText,
  MapPin,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { listClips, getClip, deleteClip, storageEstimate, MAX_CLIPS } from '../engine/storage/db';
import { generateClipReport } from '../engine/storage/pdf';
import { Badge, Modal, Toast } from '../components/ui/Bits';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/useToast';
import { formatDuration, formatBytes, mapsLink } from '../lib/format';
import type { ClipMeta } from '../lib/types';

// Draws a static waveform preview from WAV bytes
function WaveformPreview({ wav, tone = 'teal' }: { wav: ArrayBuffer; tone?: 'teal' | 'coral' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const n = (wav.byteLength - 44) / 2;
    const samples = new Int16Array(wav, 44, n);
    const buckets = 120;
    const per = Math.floor(n / buckets);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    for (let b = 0; b < buckets; b++) {
      let peak = 0;
      for (let i = b * per; i < (b + 1) * per && i < n; i++) {
        const a = Math.abs(samples[i]) / 32768;
        if (a > peak) peak = a;
      }
      const bh = Math.max(2, peak * h);
      ctx.fillStyle = tone === 'teal' ? '#2A9D8F' : '#D1495B';
      ctx.fillRect((b * w) / buckets, (h - bh) / 2, Math.max(1.5, w / buckets - 1.5), bh);
    }
  }, [wav, tone]);
  return <canvas ref={ref} className="h-12 w-full" aria-label="Waveform preview" role="img" />;
}

function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const d = 0.004;
  return (
    <a
      href={mapsLink(lat, lng)}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-xl border border-line dark:border-lineDark/50"
      aria-label={`Open map at ${lat}, ${lng}`}
    >
      <iframe
        title="Clip location map"
        className="h-28 w-full pointer-events-none"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`}
        loading="lazy"
      />
    </a>
  );
}

export default function Vault() {
  const [clips, setClips] = useState<ClipMeta[]>([]);
  const [wavs, setWavs] = useState<Record<string, ArrayBuffer>>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const { toast, show } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.title = 'Shecurity — Evidence Vault';
    refresh();
    storageEstimate().then(setEstimate);
  }, []);

  const refresh = async () => {
    const metas = await listClips();
    setClips(metas);
    const map: Record<string, ArrayBuffer> = {};
    for (const m of metas) {
      const rec = await getClip(m.id);
      if (rec) map[m.id] = rec.wav;
    }
    setWavs(map);
  };

  const togglePlay = (id: string) => {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    const wav = wavs[id];
    if (!wav) return;
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlaying(null);
    audioRef.current = audio;
    audio.play();
    setPlaying(id);
  };

  const download = async (id: string) => {
    const rec = await getClip(id);
    if (!rec) return;
    const blob = new Blob([rec.wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = rec.meta.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id: string) => {
    await deleteClip(id);
    setConfirmDelete(null);
    refresh();
    show('Clip deleted');
  };

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    show('SHA-256 copied');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Evidence Vault</h1>
          <p className="text-sm text-mist">
            Audio evidence with tamper-proof SHA-256 hashes. Stored only in this browser (IndexedDB), max {MAX_CLIPS}{' '}
            clips.
          </p>
        </div>
        {estimate && (
          <Badge tone="neutral">
            {formatBytes(estimate.usage)} used{estimate.quota ? ` of ~${formatBytes(estimate.quota)}` : ''}
          </Badge>
        )}
      </div>

      {clips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-lineDark bg-surface p-10 text-center">
          <Hash className="mx-auto mb-3 text-steel" size={36} />
          <p className="font-medium">No evidence clips yet</p>
          <p className="mt-1 text-sm text-mist">
            When an alert completes (or a duress PIN is entered), a ~60 s WAV clip (30 s before + 30 s after) is saved
            here automatically.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {clips.map((c) => (
            <li key={c.id} className="rounded-2xl border border-lineDark/50 bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2 flex-wrap">
                    {new Date(c.createdAt).toLocaleString()}
                    <Badge tone={c.trigger === 'manual' ? 'neutral' : c.duress ? 'amber' : 'coral'}>
                      {c.duress ? '🤐 silent (duress)' : c.trigger}
                    </Badge>
                    <Badge tone="neutral">{formatDuration(c.duration)}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-mist">
                    peak score {(c.peakScore * 100).toFixed(0)}/100 · {c.device}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => togglePlay(c.id)}
                    className="rounded-lg p-2 hover:bg-white/10 text-mist hover:text-paper"
                    aria-label={playing === c.id ? 'Pause clip' : 'Play clip'}
                  >
                    {playing === c.id ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => download(c.id)}
                    className="rounded-lg p-2 hover:bg-white/10 text-mist hover:text-paper"
                    aria-label="Download WAV"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => generateClipReport(c)}
                    className="rounded-lg p-2 hover:bg-white/10 text-mist hover:text-paper"
                    aria-label="Export PDF report"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    className="rounded-lg p-2 hover:bg-white/10 text-mist hover:text-coral-light"
                    aria-label="Delete clip"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {wavs[c.id] && <div className="mt-3"><WaveformPreview wav={wavs[c.id]} tone={c.duress ? 'coral' : 'teal'} /></div>}

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink/50 px-3 py-2">
                <Hash size={14} className="text-teal-light shrink-0" />
                <code className="flex-1 truncate text-xs text-mist font-mono">{c.sha256}</code>
                <button onClick={() => copyHash(c.sha256)} className="p-1 text-mist hover:text-paper" aria-label="Copy hash">
                  <Copy size={14} />
                </button>
              </div>

              {c.location && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                  <p className="text-sm text-mist flex items-center gap-1.5">
                    <MapPin size={14} className="text-coral-light" />
                    {c.location.lat.toFixed(5)}, {c.location.lng.toFixed(5)} · ±{Math.round(c.location.accuracy)}m
                  </p>
                  <div className="w-full sm:w-56">
                    <MiniMap lat={c.location.lat} lng={c.location.lng} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-steel flex gap-1.5">
        <AlertTriangle size={13} className="mt-0.5 shrink-0" />
        Storage is capped at {MAX_CLIPS} clips — the oldest are removed automatically when the limit is exceeded.
      </p>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this clip?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => confirmDelete && remove(confirmDelete)}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p>This evidence clip and its WAV audio will be removed from this device. This cannot be undone.</p>
      </Modal>
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}
