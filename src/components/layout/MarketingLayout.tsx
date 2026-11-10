import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Radio } from 'lucide-react';
import { Button } from '../ui/Button';

const LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/demo', label: 'Live demo' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/verify', label: 'Verify evidence' },
];

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white">
        <Radio size={18} />
      </span>
      <span className={`font-display text-lg font-bold tracking-tight ${light ? 'text-paper' : 'text-body'}`}>
        She<span className="text-teal">curity</span>
      </span>
    </Link>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-paper text-body">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-teal focus:text-white focus:px-3 focus:py-2 focus:rounded-lg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-teal bg-teal/10' : 'text-muted hover:text-body'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-muted hover:text-body px-3 py-2">
              Log in
            </Link>
            <Link to="/calculator">
              <Button size="sm">Try the demo</Button>
            </Link>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-sand"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="md:hidden border-t border-line bg-paper px-4 py-3 flex flex-col gap-1" aria-label="Mobile">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-[15px] font-medium ${isActive ? 'text-teal bg-teal/10' : 'text-body'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1">
                <Button variant="ghost" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link to="/calculator" className="flex-1">
                <Button className="w-full">Try demo</Button>
              </Link>
            </div>
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <footer className="border-t border-line bg-sand/50 mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 text-sm text-muted max-w-sm">
              The safety app that listens before you have to call. On-device AI, black-box evidence, and a duress PIN —
              built for HERHACK 2026.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/features" className="hover:text-body">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-body">How it works</Link></li>
              <li><Link to="/demo" className="hover:text-body">Live demo</Link></li>
              <li><Link to="/verify" className="hover:text-body">Verify evidence</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Trust</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/privacy" className="hover:text-body">Privacy &amp; limitations</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-body">GitHub</a></li>
              <li><span>HERHACK 2026 submission</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-muted">
          © 2026 Shecurity · Built for the HERHACK 2026 Women Safety special award · Free &amp; open source
        </div>
      </footer>
    </div>
  );
}
