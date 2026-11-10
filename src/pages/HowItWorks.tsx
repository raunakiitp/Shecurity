import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, Calculator, Mic, Gauge, Archive, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

const STEPS = [
  {
    n: 1,
    icon: Calculator,
    title: 'Open the Calculator (disguise)',
    text: 'The app looks like a plain calculator: it does real math, shows no branding, and the browser tab just says "Calculator".',
    cta: { label: 'Open calculator', to: '/calculator' },
  },
  {
    n: 2,
    icon: Gauge,
    title: 'Unlock with the secret code',
    text: 'Type 1234 then press =. The hidden dashboard slides in. Any other math just… does math.',
    cta: { label: 'Unlock in demo', to: '/calculator' },
  },
  {
    n: 3,
    icon: Mic,
    title: 'Turn monitoring ON',
    text: 'The AI model (YAMNet) loads from the app itself — no internet calls at demo time. The danger meter starts listening.',
    cta: { label: 'Go to demo account', to: '/login' },
  },
  {
    n: 4,
    icon: Mic,
    title: 'Play the scream sample',
    text: 'Use the "Test with sound" panel — a bundled sample plays through your speakers and the meter climbs. No need to scream yourself.',
    cta: { label: 'Open dashboard', to: '/login' },
  },
  {
    n: 5,
    icon: Archive,
    title: 'Watch the alert + evidence',
    text: 'Verified distress starts a 10 s countdown with PIN check. Enter the Duress PIN (default shown in demo) — screen says cancelled, but the clip saves silently with a SHA-256 hash.',
    cta: { label: 'See the Vault', to: '/login' },
  },
  {
    n: 6,
    icon: MapPin,
    title: 'Share location & verify',
    text: 'Send the live Maps link via WhatsApp/SMS to demo contacts, then verify the clip hash on the public verify page.',
    cta: { label: 'Open verify page', to: '/verify' },
  },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
      <motion.div {...fadeUp}>
        <h1 className="font-display text-4xl font-bold">How it works</h1>
        <p className="mt-3 text-lg text-muted">
          Six steps, two minutes. Every step has a button that drops you straight into that part of the app.
        </p>
      </motion.div>

      <ol className="mt-12 space-y-6">
        {STEPS.map((s, i) => (
          <motion.li key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="flex gap-5">
            <div className="flex flex-col items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal text-white">
                <s.icon size={20} />
              </span>
              {i < STEPS.length - 1 && <span className="w-0.5 flex-1 bg-line my-2" />}
            </div>
            <div className="flex-1 pb-6">
              <h2 className="font-display text-xl font-bold">
                <span className="text-teal mr-2">{s.n}.</span>
                {s.title}
              </h2>
              <p className="mt-1.5 text-muted">{s.text}</p>
              <Link to={s.cta.to} className="mt-3 inline-block">
                <Button size="sm" variant="ghost">
                  {s.cta.label} <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </motion.li>
        ))}
      </ol>

      <JudgeScript />
    </div>
  );
}

function JudgeScript() {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...fadeUp} className="mt-10 rounded-2xl border border-line bg-sand overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="font-display text-lg font-bold">Judge Demo Script — the exact 2-minute flow</span>
          <span className="block text-sm text-muted">For HERHACK evaluators: follow this script for the full experience.</span>
        </span>
        <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={20} />
      </button>
      {open && (
        <div className="border-t border-line bg-white px-6 py-5">
          <ol className="space-y-3 text-[15px]">
            <li><strong>1.</strong> Open <Link className="text-teal underline" to="/calculator">/calculator</Link> — it's a normal calculator.</li>
            <li><strong>2.</strong> Type <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-sm">1234=</code> → hidden dashboard opens.</li>
            <li><strong>3.</strong> Flip <strong>Monitoring</strong> ON — "Preparing on-device AI…" appears once, then "YAMNet ready".</li>
            <li><strong>4.</strong> In <strong>Test with sound</strong>, press <em>Play scream sample</em> with speakers on.</li>
            <li><strong>5.</strong> Watch the danger meter rise → state becomes "Possible distress" → alert countdown starts.</li>
            <li><strong>6.</strong> Enter the <strong>duress PIN</strong> (demo user: <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-sm">9999</code>) — screen shows "Alert cancelled ✔".</li>
            <li><strong>7.</strong> Open <strong>Evidence Vault</strong> — a ~60 s clip exists: 30 s pre-roll + 30 s post-roll, SHA-256 hash, timestamp, location.</li>
            <li><strong>8.</strong> Export the <strong>PDF report</strong>; open <Link className="text-teal underline" to="/verify">/verify</Link> and drop the downloaded WAV + paste the hash → <em>Match</em>.</li>
            <li><strong>9.</strong> In the Vault note the hidden <em>silent (duress)</em> marker — proof the fake-cancel worked while evidence was captured.</li>
          </ol>
          <p className="mt-4 text-sm text-muted">
            Demo account PINs: Real <code className="font-mono">1234</code> · Duress <code className="font-mono">9999</code> · Unlock code <code className="font-mono">1234=</code>
          </p>
        </div>
      )}
    </motion.div>
  );
}
