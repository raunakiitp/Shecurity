import { motion } from 'framer-motion';
import { ShieldCheck, CloudOff, Mic, MapPin, Power, MonitorSmartphone, Send, KeyRound, Eye, AlertTriangle } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <motion.div {...fadeUp}>
        <h1 className="font-display text-4xl font-bold">Privacy &amp; limitations, in plain language</h1>
        <p className="mt-3 text-lg text-muted">
          A safety tool earns trust by being honest about what it can and cannot do. Here is exactly where your data
          goes — and where the web platform stops us.
        </p>
      </motion.div>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-teal" size={22} /> What stays on your device
        </h2>
        <ul className="space-y-3 text-[15px]">
          <li className="flex gap-2.5"><CloudOff className="text-teal shrink-0 mt-0.5" size={18} /><span><strong>All audio.</strong> The microphone stream is processed by AI inside your browser (TensorFlow.js + YAMNet). Clips are stored in your browser's IndexedDB. Nothing is uploaded — there is no server to upload to.</span></li>
          <li className="flex gap-2.5"><KeyRound className="text-teal shrink-0 mt-0.5" size={18} /><span><strong>Passwords &amp; PINs.</strong> Hashed with PBKDF2-SHA256 (150,000 iterations) and a random salt. Plain values are never stored anywhere.</span></li>
          <li className="flex gap-2.5"><Eye className="text-teal shrink-0 mt-0.5" size={18} /><span><strong>Contacts &amp; settings.</strong> Saved in localStorage on this device only. Clearing browser data removes everything.</span></li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Mic className="text-amber" size={22} /> The one honest exception
        </h2>
        <div className="rounded-2xl border border-amber/40 bg-amber/10 p-5 text-[15px]">
          <p>
            <strong>Scream detection runs fully on your device.</strong> Keyword detection is different: it uses your
            browser's built-in speech recognition (in Chrome, that is Google's speech service, which processes audio in
            the cloud). It is <strong>off by default</strong>, you must explicitly enable it in Settings or Onboarding,
            and this disclosure is shown right next to the toggle. If you never enable it, no audio ever leaves your
            device.
          </p>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="text-coral" size={22} /> What a web app cannot do
        </h2>
        <ul className="space-y-3 text-[15px]">
          <li className="flex gap-2.5"><MonitorSmartphone className="text-coral shrink-0 mt-0.5" size={18} /><span><strong>Run with the screen off.</strong> Browsers pause work when the screen sleeps. Shecurity requests a Screen Wake Lock while monitoring so the screen stays on — you'll see the browser's mic indicator.</span></li>
          <li className="flex gap-2.5"><Power className="text-coral shrink-0 mt-0.5" size={18} /><span><strong>Detect the power button.</strong> Hardware key events are not exposed to web apps. The planned native Android app will support triple-press power trigger.</span></li>
          <li className="flex gap-2.5"><Send className="text-coral shrink-0 mt-0.5" size={18} /><span><strong>Auto-send messages.</strong> Browsers require one user tap per link/message. Shecurity's share panel steps contact-by-contact with a "Next contact" button — honest, but not automatic.</span></li>
          <li className="flex gap-2.5"><MapPin className="text-coral shrink-0 mt-0.5" size={18} /><span><strong>Background GPS.</strong> Location updates stop when the tab is closed. The alert screen keeps watching while it's open.</span></li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Roadmap (native app)</h2>
        <p className="mt-3 text-[15px] text-muted">
          A native Android version would remove these limits: true background monitoring, triple power-press trigger,
          SMS send without taps, and offline maps. The web app you're using is the hackathon build — every feature in it
          is real and runs locally.
        </p>
      </section>

      <section className="mt-12 rounded-2xl bg-ink text-paper p-6">
        <h2 className="font-display text-xl font-bold">For evaluators</h2>
        <p className="mt-2 text-[15px] text-paper/80">
          Every claim on this page maps to code in the repository: audio pipeline in{' '}
          <code className="font-mono text-sm">src/engine/audio</code>, hashing in{' '}
          <code className="font-mono text-sm">src/engine/crypto</code>, storage in{' '}
          <code className="font-mono text-sm">src/engine/storage</code>. The public{' '}
          <a className="underline" href="/verify">/verify</a> page lets you recompute any clip's SHA-256 yourself.
        </p>
      </section>
    </div>
  );
}
