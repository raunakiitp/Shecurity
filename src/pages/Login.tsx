import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { useShecurity } from '../app/shecurity-context';
import { login } from '../app/auth';

export default function Login() {
  const { onUserChanged } = useShecurity();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email, password, remember);
    setBusy(false);
    if (res.ok) {
      onUserChanged(res.user);
      navigate(res.user.onboarded ? '/dashboard' : '/onboarding');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
      <p className="text-muted mb-8 text-[15px]">Log in to your Shecurity.</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          autoComplete="current-password"
          required
          error={error}
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-teal"
          />
          Remember me on this device
        </label>
        <Button type="submit" className="w-full" loading={busy}>
          Log in
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <Button
        variant="ghost"
        className="w-full"
        onClick={async () => {
          const { continueAsDemo } = await import('../app/auth');
          const u = await continueAsDemo();
          onUserChanged(u);
          navigate('/dashboard');
        }}
      >
        Continue as Demo User
      </Button>
      <div className="mt-6 rounded-xl border border-line bg-sand/60 p-4 text-sm text-muted flex gap-2.5">
        <Info size={18} className="shrink-0 text-teal mt-0.5" />
        <p>
          Demo build: accounts are stored only on your device. No server, no tracking. Judges: use{' '}
          <strong>Continue as Demo User</strong> to skip setup.
        </p>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/signup" className="text-teal font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
