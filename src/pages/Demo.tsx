import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useShecurity } from '../app/shecurity-context';
import { continueAsDemo } from '../app/auth';

// Live Demo page: one click sets up the demo user and drops them on the calculator.
export default function Demo() {
  const { onUserChanged } = useShecurity();
  const navigate = useNavigate();

  // ensure demo user exists when this page opens
  useEffect(() => {
    continueAsDemo().then(onUserChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = async (target: '/calculator' | '/dashboard') => {
    const u = await continueAsDemo();
    onUserChanged(u);
    navigate(target, { state: target === '/dashboard' ? { unlocked: true } : undefined });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal text-white">
          <Rocket size={30} />
        </span>
        <h1 className="font-display text-4xl font-bold">Live demo</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">
          One tap. The demo account (with sample contacts and PINs already configured) is created on your device —
          nothing is sent anywhere.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-sand p-6">
          <h2 className="font-display text-xl font-bold">Start from the disguise</h2>
          <p className="mt-2 text-sm text-muted">
            Opens the calculator. Unlock with <code className="rounded bg-white px-1.5 py-0.5 font-mono">1234=</code>
          </p>
          <Button className="mt-4 w-full" onClick={() => go('/calculator')} icon={<Play size={16} />}>
            Open calculator
          </Button>
        </div>
        <div className="rounded-2xl border border-line bg-sand p-6">
          <h2 className="font-display text-xl font-bold">Jump straight in</h2>
          <p className="mt-2 text-sm text-muted">
            Opens the dashboard already unlocked, with sample contacts and PINs ready.
          </p>
          <Button className="mt-4 w-full" variant="ghost" onClick={() => go('/dashboard')}>
            Open dashboard
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Demo credentials (all local)</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          <li>Unlock code: <code className="font-mono">1234=</code></li>
          <li>Real PIN: <code className="font-mono">1234</code> — cancels alerts</li>
          <li>Duress PIN: <code className="font-mono">9999</code> — fake cancel + silent alert</li>
          <li>Sample contacts: Aarti (Mom), Neha, Rohit — WhatsApp links open with prefilled emergency text</li>
        </ul>
      </div>
    </div>
  );
}
