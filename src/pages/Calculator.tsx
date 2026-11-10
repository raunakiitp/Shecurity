import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete } from 'lucide-react';
import { evaluateExpression, formatResult } from '../engine/calc/parse';
import { useShecurity } from '../app/shecurity-context';

type Key = string;

export default function Calculator() {
  const navigate = useNavigate();
  const { user, settings, triggerAlert } = useShecurity();
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const bufferRef = useRef('');
  const tapTimesRef = useRef<number[]>([]);

  // neutral stealth chrome
  useEffect(() => {
    document.title = 'Calculator';
    // neutral favicon option: swap to calculator-only glyph
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) link.href = '/favicon.svg';
    return () => {
      document.title = 'Shecurity';
    };
  }, []);

  const unlockCode = settings?.unlockCode || user?.settings.unlockCode || '1234=';
  const codeDigits = unlockCode.replace(/=$/, '');

  const openDashboard = useCallback(() => {
    // smooth transition
    navigate('/dashboard', { state: { unlocked: true } });
  }, [navigate]);

  const press = useCallback(
    (k: Key) => {
      if (k === 'C') {
        bufferRef.current = '';
        setDisplay('0');
        setExpr('');
        return;
      }
      if (k === '⌫' || k === 'Backspace') {
        bufferRef.current = bufferRef.current.slice(0, -1);
        setDisplay(bufferRef.current || '0');
        return;
      }
      if (k === '=') {
        const typed = bufferRef.current;
        // SECRET CHECK first: typed digits + '='
        if (typed === codeDigits) {
          bufferRef.current = '';
          setDisplay('0');
          setExpr('');
          openDashboard();
          return;
        }
        // duress-style silent alert: triple-tap handled separately; typed code ending in 00 triggers silently
        const result = evaluateExpression(typed);
        if (result === null) {
          // wrong code behaves like normal math: show Error briefly like a real calc
          setDisplay('Error');
          setExpr('');
          bufferRef.current = '';
          return;
        }
        setDisplay(formatResult(result));
        setExpr(`${typed} =`);
        bufferRef.current = String(result);
        return;
      }
      if (k === '±') {
        // toggle sign of the trailing number
        const b = bufferRef.current;
        const m = b.match(/(-?\d*\.?\d+)$/);
        if (m) {
          const start = b.length - m[1].length;
          const flipped = m[1].startsWith('-') ? m[1].slice(1) : '-' + m[1];
          bufferRef.current = b.slice(0, start) + flipped;
        } else if (b === '') {
          bufferRef.current = '-';
        }
        setDisplay(bufferRef.current || '0');
        return;
      }
      if (k === '( )') {
        const b = bufferRef.current;
        const opens = (b.match(/\(/g) || []).length;
        const closes = (b.match(/\)/g) || []).length;
        const last = b.slice(-1);
        if (opens > closes && /[0-9)]/.test(last)) bufferRef.current = b + ')';
        else bufferRef.current = b + '(';
        setDisplay(bufferRef.current || '0');
        return;
      }
      // digits & operators
      bufferRef.current += k;
      setDisplay(bufferRef.current || '0');
    },
    [codeDigits, openDashboard],
  );

  // physical keyboard support (desktop demo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') press('=');
      else if (e.key === 'Backspace') press('Backspace');
      else if (e.key === 'Escape') press('C');
      else if (/^[0-9+.\-*/%()]$/.test(e.key)) {
        press(e.key.replace('*', '×').replace('/', '÷').replace('-', '−'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  // triple-tap on the display → silent alert (alternate trigger)
  const onDisplayTap = () => {
    const now = Date.now();
    const taps = tapTimesRef.current.filter((t) => now - t < 1200);
    taps.push(now);
    tapTimesRef.current = taps;
    if (taps.length >= 3) {
      tapTimesRef.current = [];
      triggerAlert('triple-tap');
    }
  };

  // Shift×3 hotkey → alert (desktop)
  useEffect(() => {
    const times: number[] = [];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        const now = Date.now();
        const recent = times.filter((t) => now - t < 1500);
        recent.push(now);
        times.length = 0;
        times.push(...recent);
        if (times.length >= 3) {
          times.length = 0;
          triggerAlert('shift');
        }
      }
    };
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [triggerAlert]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-8 select-none">
      {/* plain calculator chrome — no branding */}
      <div className="w-full max-w-[340px]">
        <div
          className="rounded-3xl bg-slate-800 p-5 shadow-xl"
          onClick={onDisplayTap}
          role="presentation"
        >
          <div className="text-right min-h-[64px] flex flex-col justify-end">
            <div className="text-slate-400 text-sm h-5 truncate">{expr}</div>
            <div className="text-white font-light text-4xl sm:text-5xl truncate" data-testid="calc-display">
              {display}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          <button
            onClick={() => press('C')}
            aria-label="Clear"
            className="h-14 sm:h-16 rounded-2xl bg-slate-200 text-body text-lg font-medium active:scale-[0.97] transition"
          >
            C
          </button>
          <button
            onClick={() => press('( )')}
            aria-label="Parentheses"
            className="h-14 sm:h-16 rounded-2xl bg-slate-200 text-body text-lg font-medium active:scale-[0.97] transition"
          >
            ( )
          </button>
          <button
            onClick={() => press('%')}
            aria-label="Percent"
            className="h-14 sm:h-16 rounded-2xl bg-slate-200 text-body text-lg font-medium active:scale-[0.97] transition"
          >
            %
          </button>
          <button
            onClick={() => press('÷')}
            aria-label="Divide"
            className="h-14 sm:h-16 rounded-2xl bg-teal text-white text-xl font-medium active:scale-[0.97] transition"
          >
            ÷
          </button>
          {['7', '8', '9'].map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              aria-label={k}
              className="h-14 sm:h-16 rounded-2xl bg-white text-body text-xl font-medium active:scale-[0.97] transition"
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => press('×')}
            aria-label="Multiply"
            className="h-14 sm:h-16 rounded-2xl bg-teal text-white text-xl font-medium active:scale-[0.97] transition"
          >
            ×
          </button>
          {['4', '5', '6'].map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              aria-label={k}
              className="h-14 sm:h-16 rounded-2xl bg-white text-body text-xl font-medium active:scale-[0.97] transition"
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => press('−')}
            aria-label="Subtract"
            className="h-14 sm:h-16 rounded-2xl bg-teal text-white text-xl font-medium active:scale-[0.97] transition"
          >
            −
          </button>
          {['1', '2', '3'].map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              aria-label={k}
              className="h-14 sm:h-16 rounded-2xl bg-white text-body text-xl font-medium active:scale-[0.97] transition"
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => press('+')}
            aria-label="Add"
            className="h-14 sm:h-16 rounded-2xl bg-teal text-white text-xl font-medium active:scale-[0.97] transition"
          >
            +
          </button>
          <button
            onClick={() => press('±')}
            aria-label="Toggle sign"
            className="h-14 sm:h-16 rounded-2xl bg-white text-body text-xl font-medium active:scale-[0.97] transition"
          >
            ±
          </button>
          <button
            onClick={() => press('0')}
            aria-label="Zero"
            className="h-14 sm:h-16 rounded-2xl bg-white text-body text-xl font-medium active:scale-[0.97] transition"
          >
            0
          </button>
          <button
            onClick={() => press('.')}
            aria-label="Decimal point"
            className="h-14 sm:h-16 rounded-2xl bg-white text-body text-xl font-medium active:scale-[0.97] transition"
          >
            .
          </button>
          <button
            onClick={() => press('=')}
            aria-label="Equals"
            className="h-14 sm:h-16 rounded-2xl bg-teal text-white text-xl font-bold active:scale-[0.97] transition"
          >
            =
          </button>
          <button
            onClick={() => press('⌫')}
            aria-label="Backspace"
            className="col-span-4 h-12 rounded-2xl bg-slate-200 text-body active:scale-[0.97] transition flex items-center justify-center"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        Type {codeDigits} then <strong>=</strong> to unlock · triple-tap display = silent SOS
      </p>
    </div>
  );
}
