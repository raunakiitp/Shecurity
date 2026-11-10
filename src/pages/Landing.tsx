import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Radio,
  Calculator,
  Mic,
  Archive,
  ShieldCheck,
  MapPin,
  Lock,
  Eye,
  Github,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Bits';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <Badge tone="teal">
              <Radio size={13} /> HERHACK 2026 · Women Safety + AI track
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
            >
              It listens <span className="text-teal">before</span> you have to call.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-5 text-lg text-muted max-w-lg"
            >
              Shecurity hides a complete safety system inside a calculator. On-device AI hears distress, keeps the
              last 30 seconds as tamper-proof evidence, and shares your live location with the people you trust —
              without you making a call.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link to="/demo">
                <Button size="lg" icon={<ArrowRight size={18} />}>
                  Try the Live Demo
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="ghost">
                  See how it works
                </Button>
              </Link>
            </motion.div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal" /> On-device AI</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal" /> No account needed to try</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal" /> Free &amp; open source</span>
            </div>
          </div>

          {/* hero photo + floating meter card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <img
              src="/images/hero-night-commute.webp"
              alt="A woman waiting at a bus stop at dusk, city lights behind her"
              className="w-full h-[420px] object-cover rounded-3xl shadow-lift"
            />
            <div className="absolute -bottom-6 -left-4 sm:left-8 w-64 rounded-2xl border border-line bg-white/95 p-4 shadow-lift backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted">DANGER METER</p>
                <span className="flex h-2 w-2 rounded-full bg-teal animate-pulse" />
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-sand overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal via-amber to-coral"
                  initial={{ width: '12%' }}
                  animate={{ width: ['12%', '78%', '30%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">Screaming · 64% · <span className="text-coral font-medium">Danger</span></p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <motion.div {...fadeUp}>
          <h2 className="font-display text-3xl font-bold max-w-xl">In the worst moment, a phone call is the hardest thing to make.</h2>
          <p className="mt-3 text-muted max-w-2xl">
            These are everyday realities, not statistics: calling for help can escalate danger, typing a message takes
            both hands and attention, and evidence of what actually happened is usually lost.
          </p>
        </motion.div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              img: '/images/walking-city-street.webp',
              alt: 'A person walking down a city street in the evening',
              title: 'Voice draws attention',
              text: 'Shouting for help can make a situation worse. Shecurity detects distress sounds instead — no call needed.',
            },
            {
              img: '/images/auto-ride.webp',
              alt: 'A three-wheeler auto rickshaw on a busy street',
              title: 'Rides and commutes',
              text: 'Auto, cab, or the walk home — monitoring runs quietly in your pocket, disguised as a calculator.',
            },
            {
              img: '/images/phone-in-hand.webp',
              alt: 'A smartphone held in one hand',
              title: 'Evidence disappears',
              text: 'The black box always keeps the last 30 seconds, hashed with SHA-256, so what happened is provable.',
            },
          ].map((c) => (
            <motion.article key={c.title} {...fadeUp} className="group rounded-2xl border border-line bg-sand overflow-hidden hover:shadow-lift transition-shadow">
              <img src={c.img} alt={c.alt} loading="lazy" className="h-44 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-display text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{c.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FEATURES PREVIEW */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl font-bold">A hidden app that does everything a safety app should.</h2>
          </motion.div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Calculator, title: 'Stealth calculator', text: 'Looks and works like a normal calculator. Your secret code opens the dashboard.' },
              { icon: Mic, title: 'On-device scream AI', text: 'YAMNet runs in your browser. Audio never leaves the phone.' },
              { icon: Archive, title: '30s black box', text: 'Pre-roll + post-roll WAV evidence with SHA-256 hash and PDF report.' },
              { icon: ShieldCheck, title: 'Dual verification', text: 'Scream + keyword = 95% confidence, fewer false alarms.' },
              { icon: Lock, title: 'Duress PIN', text: 'Fakes "cancelled" while silently alerting your contacts.' },
              { icon: MapPin, title: 'Live location', text: 'One tap sends WhatsApp/SMS with a live Google Maps link.' },
            ].map((f) => (
              <motion.div key={f.title} {...fadeUp} className="rounded-2xl border border-white/10 bg-surface p-5">
                <f.icon className="text-teal-light" size={22} />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-paper/60">{f.text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/features" className="text-teal-light font-medium hover:underline">
              Explore all 9 features →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 4 step timeline */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <motion.h2 {...fadeUp} className="font-display text-3xl font-bold text-center">
          Four steps from stealth to safety
        </motion.h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { n: 1, icon: Calculator, title: 'Open the calculator', text: 'It behaves like any calculator app. Nobody sees a safety app.' },
            { n: 2, icon: Eye, title: 'Type your secret code', text: 'Enter your code and press = — the dashboard slides in.' },
            { n: 3, icon: Mic, title: 'Monitoring listens', text: 'On-device AI watches for screams; the last 30s are always buffered.' },
            { n: 4, icon: MapPin, title: 'Alert & evidence', text: 'Verified distress triggers siren, PIN check, live location and hashed evidence.' },
          ].map((s, i) => (
            <motion.li key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal text-white">
                  <s.icon size={20} />
                </span>
                <span className="font-display text-4xl font-bold text-teal/20">{s.n}</span>
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
              {i < 3 && <span className="hidden md:block absolute top-5 -right-3 h-0.5 w-6 bg-line" />}
            </motion.li>
          ))}
        </ol>
      </section>

      {/* PRIVACY PROMISE */}
      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-8 lg:grid-cols-2 items-center">
          <motion.img
            {...fadeUp}
            src="/images/friends-support.webp"
            alt="A group of friends walking together, arms linked"
            loading="lazy"
            className="h-72 w-full object-cover rounded-3xl shadow-soft"
          />
          <motion.div {...fadeUp}>
            <h2 className="font-display text-3xl font-bold">Our privacy promise</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li className="flex gap-2.5"><ShieldCheck className="text-teal shrink-0 mt-0.5" size={19} /> Audio is processed on your device and stored only in your browser.</li>
              <li className="flex gap-2.5"><ShieldCheck className="text-teal shrink-0 mt-0.5" size={19} /> Passwords and PINs are PBKDF2-hashed with a random salt — never stored in plain text.</li>
              <li className="flex gap-2.5"><ShieldCheck className="text-teal shrink-0 mt-0.5" size={19} /> No servers, no accounts on a server, no analytics, no trackers.</li>
              <li className="flex gap-2.5"><Eye className="text-teal shrink-0 mt-0.5" size={19} /> One honest exception: optional keyword detection uses your browser's speech service. Off by default, disclosed in the UI.</li>
            </ul>
            <Link to="/privacy" className="mt-5 inline-block text-teal font-medium hover:underline">
              Read the full privacy &amp; limitations page →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <motion.div {...fadeUp} className="rounded-3xl bg-ink text-paper px-6 py-14 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl" aria-hidden="true" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold max-w-xl mx-auto">
            Two minutes to try. Nothing to install.
          </h2>
          <p className="mt-3 text-paper/70 max-w-lg mx-auto">
            Open the demo, unlock the dashboard with 1234=, turn on monitoring and play the sample scream. Watch the
            black box do its job.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/demo">
              <Button size="lg">Try the Live Demo</Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline-dark" icon={<Github size={18} />}>
                View on GitHub
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
