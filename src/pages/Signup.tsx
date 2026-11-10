import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { passwordStrength } from '../components/ui/passwordStrength';
import { useShecurity } from '../app/shecurity-context';
import { signup } from '../app/auth';

export default function Signup() {
  const { onUserChanged } = useShecurity();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (confirm !== password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const res = await signup(name.trim(), email.trim(), password);
    setBusy(false);
    if (res.ok) {
      // auto-login: session token
      const { login } = await import('../app/auth');
      const lr = await login(email.trim(), password, true);
      if (lr.ok) {
        onUserChanged(lr.user);
        navigate('/onboarding');
      }
    } else {
      setErrors({ email: res.error });
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Create your Shecurity</h1>
      <p className="text-muted mb-6 text-[15px]">
        Set up your black box in about two minutes.
      </p>
      <div className="mb-6 flex gap-2.5 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm">
        <ShieldCheck size={18} className="shrink-0 text-teal mt-0.5" />
        <p className="text-body">
          <strong>Demo build: accounts are stored only on your device.</strong> Your password is
          hashed with PBKDF2 and never leaves this browser.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User size={16} />}
          error={errors.name}
          autoComplete="name"
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          error={errors.email}
          autoComplete="email"
          required
        />
        <div>
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            error={errors.password}
            helper="Minimum 8 characters."
            autoComplete="new-password"
            required
          />
          {password && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-600'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted w-20">{strength.label}</span>
            </div>
          )}
        </div>
        <Field
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock size={16} />}
          error={errors.confirm}
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-teal font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
