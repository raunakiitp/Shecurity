import { useRef, useState } from 'react';
import { ShieldCheck, ShieldX, Upload, Hash } from 'lucide-react';
import { sha256Hex } from '../engine/crypto/secrets';
import { Field } from '../components/ui/Field';

// Public /verify page — no login. Drag & drop a WAV, paste the expected hash, get Match/Tampered.
export default function VerifyEvidence() {
  const [file, setFile] = useState<File | null>(null);
  const [computed, setComputed] = useState<string | null>(null);
  const [expected, setExpected] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const result =
    computed && expected
      ? computed.toLowerCase() === expected.trim().toLowerCase()
        ? 'match'
        : 'tampered'
      : null;

  const handleFile = async (f: File) => {
    setFile(f);
    setComputed(null);
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const hash = await sha256Hex(buf);
      setComputed(hash);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <Hash size={26} />
        </span>
        <h1 className="font-display text-3xl font-bold">Verify evidence</h1>
        <p className="mt-2 text-muted">
          Every Shecurity clip carries a SHA-256 hash. Upload the WAV and paste the hash from its PDF report or
          the Vault — if even one byte changed, the hash won't match.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? 'border-teal bg-teal/5' : 'border-line bg-sand/50 hover:border-teal/50'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload a WAV file to verify"
      >
        <Upload className="mx-auto mb-3 text-muted" size={28} />
        <p className="font-medium">{file ? file.name : 'Drag & drop the .wav file here'}</p>
        <p className="mt-1 text-sm text-muted">or click to browse · nothing is uploaded, hashing happens in your browser</p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/wav,audio/x-wav,.wav"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      <div className="mt-6">
        <Field
          label="Expected SHA-256 hash"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Paste the 64-character hash from the Vault / PDF"
          helper="Optional — without it we simply show the computed hash."
        />
      </div>

      {busy && <p className="mt-4 text-sm text-muted" role="status">Computing SHA-256…</p>}

      {computed && (
        <div className="mt-6 space-y-4">
          {result === 'match' && (
            <div className="flex items-start gap-3 rounded-xl border border-teal/30 bg-teal/10 p-4" role="status">
              <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={22} />
              <div>
                <p className="font-semibold text-teal">Match — evidence intact</p>
                <p className="text-sm text-muted">The file is byte-for-byte identical to when it was captured.</p>
              </div>
            </div>
          )}
          {result === 'tampered' && (
            <div className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral/10 p-4" role="alert">
              <ShieldX className="mt-0.5 shrink-0 text-coral" size={22} />
              <div>
                <p className="font-semibold text-coral">Tampered — hashes differ</p>
                <p className="text-sm text-muted">This file has changed since the hash was recorded. Do not trust it as evidence.</p>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Computed SHA-256</p>
            <code className="mt-1 block break-all font-mono text-sm">{computed}</code>
          </div>
          {result === 'tampered' && expected && (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Expected (from report)</p>
              <code className="mt-1 block break-all font-mono text-sm text-coral">{expected}</code>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 rounded-xl bg-sand p-4 text-sm text-muted">
        <p className="font-medium text-body mb-1">How to verify without this page</p>
        <p>
          On Windows: <code className="font-mono">certutil -hashfile clip.wav SHA256</code> · on macOS/Linux:{' '}
          <code className="font-mono">shasum -a 256 clip.wav</code>. Compare with the hash in the Vault or PDF report.
        </p>
      </div>
    </div>
  );
}
