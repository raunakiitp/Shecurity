import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

interface FeatureSection {
  title: string;
  bullets: string[];
  img: string;
  alt: string;
  diagram?: 'waveform' | 'buffer' | 'dual' | 'duress' | 'location';
}

const FEATURES: FeatureSection[] = [
  {
    title: 'Stealth Calculator',
    bullets: [
      'A real calculator — digits, operators, percent, parentheses, correct precedence.',
      'No Shecurity branding, neutral app title, neutral favicon.',
      'Your secret code + = opens the hidden dashboard.',
      'Wrong codes behave like normal math — zero hints.',
    ],
    img: '/images/calculator-desk.webp',
    alt: 'A calculator lying on a study desk',
    diagram: 'duress',
  },
  {
    title: 'On-device Scream Detection',
    bullets: [
      'YAMNet (Google AudioSet) runs fully in your browser via TensorFlow.js.',
      'Microphone audio is analyzed locally — nothing is uploaded.',
      'Weighted classes: Screaming, Yell, Shout, Bellow, Crying, Whimper.',
      'Smoothing + 2-window confirmation + 30 s cooldown cut false alarms.',
    ],
    img: '/images/phone-in-hand.webp',
    alt: 'A smartphone held in one hand',
    diagram: 'waveform',
  },
  {
    title: 'Live Danger Meter',
    bullets: [
      'Animated 0–100 gauge with Safe / Watch / Danger zones.',
      'Real-time waveform canvas driven by the microphone.',
      'Top-3 detected sound labels with confidence bars.',
      'State text: Listening… → Unusual sound → Possible distress.',
    ],
    img: '/images/hero-night-commute.webp',
    alt: 'A woman waiting at a bus stop at dusk',
  },
  {
    title: 'Black Box 30s Pre-Recording',
    bullets: [
      'A rolling 30-second buffer of raw PCM is always in memory.',
      'When an alert fires, the pre-roll is frozen and 30 more seconds are recorded.',
      'The result is a ~60 s playable WAV — including what happened BEFORE.',
      'Never uses MediaRecorder chunks (they are not independently playable).',
    ],
    img: '/images/auto-ride.webp',
    alt: 'A three-wheeler auto rickshaw on a busy street',
    diagram: 'buffer',
  },
  {
    title: 'Dual Verification',
    bullets: [
      'Scream detection and keyword detection are independent signals.',
      'Both within 8 seconds → 95%+ confidence → instant alert.',
      'Only one signal → a 15-second "Are you safe?" prompt first.',
      'Hindi, Hinglish and English keywords: bachao, help, chhod do, police…',
    ],
    img: '/images/friends-support.webp',
    alt: 'A group of friends walking together',
    diagram: 'dual',
  },
  {
    title: 'Duress PIN',
    bullets: [
      'A second PIN for when someone forces you to "cancel".',
      'The screen shows a convincing "Alert cancelled ✔".',
      'Silently: alerts are sent, location sharing starts, evidence saves.',
      'Only a hidden marker in the Vault reveals the truth.',
    ],
    img: '/images/walking-city-street.webp',
    alt: 'A person walking down a city street in the evening',
    diagram: 'duress',
  },
  {
    title: 'Tamper-proof Evidence',
    bullets: [
      'Every clip is hashed with SHA-256 the moment it is saved.',
      'Timestamp, trigger type, peak score and location are stored with it.',
      'Public /verify page: upload a WAV → Match / Tampered.',
      'One-tap PDF report with hash, map link and disclaimer.',
    ],
    img: '/images/calculator-desk.webp',
    alt: 'A calculator on a desk with paperwork',
  },
  {
    title: 'Live Location Sharing',
    bullets: [
      'High-accuracy GPS with continuous updates while an alert is active.',
      'Map with accuracy circle (Leaflet + OpenStreetMap).',
      'WhatsApp, SMS, Copy and native Share — per selected contact.',
      '"Next contact" stepper because browsers allow one send per tap.',
    ],
    img: '/images/phone-in-hand.webp',
    alt: 'A smartphone showing a map',
    diagram: 'location',
  },
  {
    title: 'Multiple Triggers',
    bullets: [
      'Hold the SOS button 1.5 s (progress ring shows the countdown).',
      'Shake the phone 3 strong times (DeviceMotion, iOS permission handled).',
      'Triple-tap the calculator display for a silent alert.',
      'Desktop: press Shift 3 times. Power button: needs the native app (roadmap).',
    ],
    img: '/images/friends-support.webp',
    alt: 'Friends together in support',
  },
];

function Diagram({ kind }: { kind: NonNullable<FeatureSection['diagram']> }) {
  const common = 'w-full rounded-xl border border-line bg-white p-4';
  if (kind === 'waveform')
    return (
      <svg viewBox="0 0 320 90" className={common} role="img" aria-label="Audio waveform diagram">
        {[...Array(40)].map((_, i) => {
          const h = 8 + Math.abs(Math.sin(i * 0.55)) * 60;
          return <rect key={i} x={i * 8} y={(90 - h) / 2} width={5} height={h} rx="2.5" fill="#1F7A6D" opacity={i > 30 ? 0.35 : 0.85} />;
        })}
      </svg>
    );
  if (kind === 'buffer')
    return (
      <svg viewBox="0 0 320 110" className={common} role="img" aria-label="Rolling buffer timeline">
        <rect x="10" y="30" width="300" height="30" rx="8" fill="#EDE7DB" />
        <rect x="10" y="30" width="150" height="30" rx="8" fill="#1F7A6D" opacity="0.8" />
        <text x="85" y="50" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">pre-roll 30s</text>
        <rect x="160" y="30" width="150" height="30" rx="8" fill="#D1495B" opacity="0.85" />
        <text x="235" y="50" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">post-roll 30s</text>
        <text x="10" y="22" fontSize="11" fill="#5B6475">ALERT fires here ↓</text>
        <path d="M160 62 L160 78" stroke="#5B6475" strokeWidth="2" />
        <text x="160" y="95" textAnchor="middle" fontSize="11" fill="#5B6475">≈60 s WAV saved + SHA-256</text>
      </svg>
    );
  if (kind === 'dual')
    return (
      <svg viewBox="0 0 320 100" className={common} role="img" aria-label="Dual verification diagram">
        <rect x="10" y="10" width="130" height="34" rx="8" fill="#1F7A6D" />
        <text x="75" y="32" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">Sound ✔ (scream)</text>
        <rect x="10" y="56" width="130" height="34" rx="8" fill="#E9A23B" />
        <text x="75" y="78" textAnchor="middle" fontSize="11" fill="#14213D" fontWeight="700">Words ✔ (keyword)</text>
        <path d="M140 27 H185 M140 73 H185" stroke="#5B6475" strokeWidth="2" />
        <rect x="185" y="33" width="125" height="34" rx="8" fill="#14213D" />
        <text x="247" y="55" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">Alert (95%+ conf.)</text>
      </svg>
    );
  if (kind === 'duress')
    return (
      <svg viewBox="0 0 320 90" className={common} role="img" aria-label="Duress PIN flow">
        <rect x="10" y="25" width="90" height="40" rx="8" fill="#D1495B" />
        <text x="55" y="50" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">Duress PIN</text>
        <path d="M100 45 H130" stroke="#5B6475" strokeWidth="2" />
        <rect x="130" y="25" width="85" height="40" rx="8" fill="#EDE7DB" />
        <text x="172" y="50" textAnchor="middle" fontSize="11" fill="#1B1F2A" fontWeight="700">"Cancelled ✔"</text>
        <path d="M215 45 H245" stroke="#5B6475" strokeWidth="2" />
        <rect x="245" y="25" width="65" height="40" rx="8" fill="#14213D" />
        <text x="277" y="43" textAnchor="middle" fontSize="10" fill="#E9A23B" fontWeight="700">silent</text>
        <text x="277" y="57" textAnchor="middle" fontSize="10" fill="#E9A23B" fontWeight="700">alert</text>
      </svg>
    );
  return (
    <svg viewBox="0 0 320 90" className={common} role="img" aria-label="Location share flow">
      <circle cx="45" cy="45" r="22" fill="#1F7A6D" opacity="0.2" />
      <circle cx="45" cy="45" r="10" fill="#1F7A6D" />
      <path d="M67 45 H120" stroke="#5B6475" strokeWidth="2" markerEnd="url(#ar)" />
      <defs>
        <marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#5B6475" /></marker>
      </defs>
      <rect x="120" y="25" width="85" height="40" rx="8" fill="#EDE7DB" />
      <text x="162" y="50" textAnchor="middle" fontSize="11" fill="#1B1F2A" fontWeight="700">Maps link</text>
      <path d="M205 45 H235" stroke="#5B6475" strokeWidth="2" />
      <rect x="235" y="25" width="75" height="40" rx="8" fill="#14213D" />
      <text x="272" y="43" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">WhatsApp</text>
      <text x="272" y="57" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">/ SMS</text>
    </svg>
  );
}

export default function Features() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <motion.div {...fadeUp} className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold">Everything, in detail</h1>
        <p className="mt-3 text-lg text-muted">
          Nine features that make Shecurity more than a panic button. Each one is real, working code — try them in
          the demo.
        </p>
      </motion.div>
      <div className="mt-14 space-y-16">
        {FEATURES.map((f, i) => (
          <motion.section key={f.title} {...fadeUp} className="grid gap-8 lg:grid-cols-2 items-center">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <img src={f.img} alt={f.alt} loading="lazy" className="h-64 w-full object-cover rounded-2xl shadow-soft" />
            </div>
            <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
              <span className="font-display text-sm font-bold text-teal">0{i + 1}</span>
              <h2 className="mt-1 font-display text-2xl font-bold">{f.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {f.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-[15px] text-muted">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                    {b}
                  </li>
                ))}
              </ul>
              {f.diagram && (
                <div className="mt-5">
                  <Diagram kind={f.diagram} />
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Link to="/demo">
          <Button size="lg" icon={<ArrowRight size={18} />}>
            Try it all in the live demo
          </Button>
        </Link>
      </div>
    </div>
  );
}
