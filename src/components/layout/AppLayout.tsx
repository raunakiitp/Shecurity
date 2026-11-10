import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Archive,
  Settings as SettingsIcon,
  Lock,
  HeartPulse,
} from 'lucide-react';
import { useShecurity } from '../../app/shecurity-context';
import { Badge } from '../ui/Bits';
import { cn } from '../../lib/cn';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/vault', label: 'Evidence Vault', icon: Archive },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, monitoring, logout } = useShecurity();
  const navigate = useNavigate();

  // keep document title neutral-ish but identifiable
  useEffect(() => {
    document.title = 'Shecurity — Dashboard';
  }, []);

  const lock = () => {
    navigate('/calculator');
  };

  return (
    <div className="dark min-h-screen bg-ink text-paper on-dark">
      {/* top bar */}
      <header className="sticky top-0 z-40 bg-ink/95 backdrop-blur border-b border-lineDark/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal text-white">
              <HeartPulse size={18} />
            </span>
            <div
              className="min-w-0 cursor-pointer select-none"
              id="dashboard-title"
              title="Double-tap to lock instantly"
            >
              <p className="font-display font-bold leading-tight truncate">
                {user?.name ? `${user.name.split(' ')[0]}'s Shecurity` : 'Shecurity'}
              </p>
              <p className="text-[11px] text-mist leading-tight">Black Box active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {monitoring ? (
              <Badge tone="teal">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-teal-light opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-light" />
                </span>
                Listening
              </Badge>
            ) : (
              <Badge tone="neutral">Idle</Badge>
            )}
            <button
              onClick={lock}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-coral px-3 text-sm font-medium text-white hover:bg-coral-hover active:scale-[0.98] transition"
              aria-label="Lock now and return to the calculator"
            >
              <Lock size={15} /> Lock
            </button>
          </div>
        </div>
        {/* desktop nav */}
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 hidden sm:flex gap-1 pb-2" aria-label="App">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-white/10 text-paper' : 'text-mist hover:text-paper hover:bg-white/5',
                )
              }
            >
              <n.icon size={15} /> {n.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-mist hover:text-paper"
          >
            Log out
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-28 sm:pb-10">{children}</main>

      {/* mobile bottom nav */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-lineDark/60 grid grid-cols-5"
        aria-label="App bottom"
      >
        {[...NAV, { to: '/calculator', label: 'Lock', icon: Lock }].map((n) => (
          <NavLink
            key={n.label}
            to={n.to}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium',
              'text-mist',
            )}
          >
            <n.icon size={19} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
