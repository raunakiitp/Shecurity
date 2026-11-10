import { useEffect, useRef } from 'react';

// Animated semicircular danger gauge 0-100
export function DangerMeter({ score, zone }: { score: number; zone: 'safe' | 'watch' | 'danger' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const target = Math.max(0, Math.min(100, score * 100));
    const zoneColors: Record<string, string> = { safe: '#3FBFAE', watch: '#E9A23B', danger: '#F2A0AB' };

    const draw = (v: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.86;
      const r = Math.min(w * 0.4, h * 0.72);
      const start = Math.PI;
      const end = 2 * Math.PI;

      // track
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, end);
      ctx.stroke();

      // zone ticks (subtle)
      for (const [frac, color] of [
        [0.3, 'rgba(42,157,143,0.25)'],
        [0.6, 'rgba(233,162,59,0.25)'],
        [1.0, 'rgba(209,73,91,0.25)'],
      ] as [number, string][]) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        const a = start + frac * (end - start);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 13, a - 0.008, a + 0.008);
        ctx.stroke();
      }

      // value arc
      const valAngle = start + (v / 100) * (end - start);
      const grad = ctx.createLinearGradient(0, h, w, 0);
      grad.addColorStop(0, '#2A9D8F');
      grad.addColorStop(0.6, '#E9A23B');
      grad.addColorStop(1, '#D1495B');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, valAngle);
      ctx.stroke();

      // needle dot
      const nx = cx + Math.cos(valAngle) * r;
      const ny = cy + Math.sin(valAngle) * r;
      ctx.fillStyle = zoneColors[zone];
      ctx.beginPath();
      ctx.arc(nx, ny, 9, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#14213D';
      ctx.beginPath();
      ctx.arc(nx, ny, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      // number
      ctx.fillStyle = '#F7F4EE';
      ctx.font = `700 ${Math.round(r * 0.42)}px Fraunces, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(v)), cx, cy - r * 0.15);
      ctx.fillStyle = '#B4BCCB'; // mist token — AA on ink/surface
      ctx.font = `600 ${Math.round(r * 0.13)}px Inter, sans-serif`;
      ctx.fillText('DANGER INDEX', cx, cy - r * 0.15 + r * 0.24);
    };

    // spring-ish animation
    const animate = () => {
      const diff = target - currentRef.current;
      if (Math.abs(diff) < 0.1) {
        currentRef.current = target;
      } else {
        currentRef.current += diff * 0.14;
      }
      draw(currentRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score, zone]);

  const stateText = zone === 'safe' ? 'Listening…' : zone === 'watch' ? 'Unusual sound' : 'Possible distress';
  const stateColor = { safe: 'text-teal-light', watch: 'text-amber', danger: 'text-coral-light' }[zone];

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} className="w-full max-w-[300px] h-[170px]" aria-label={`Danger meter at ${Math.round(score * 100)} of 100`} role="img" />
      <p className={`-mt-8 text-sm font-semibold ${stateColor}`} aria-live="polite">
        {stateText}
      </p>
    </div>
  );
}

// Real-time waveform from the levels array
export function WaveformCanvas({ levels, zone }: { levels: number[]; zone: 'safe' | 'watch' | 'danger' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const smoothedRef = useRef<number[]>(levels);

  useEffect(() => {
    smoothedRef.current = levels;
  }, [levels]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);
      const data = smoothedRef.current;
      const n = data.length;
      const bw = w / n;
      const color = ({ safe: '#3FBFAE', watch: '#E9A23B', danger: '#F2A0AB' } as Record<string, string>)[zone];
      for (let i = 0; i < n; i++) {
        const v = data[i];
        const bh = Math.max(1.5, v * (h * 0.85));
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25 + 0.75 * v;
        ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 1.2), bh);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [zone]);

  return <canvas ref={ref} className="w-full h-24 rounded-xl bg-ink/60 border border-lineDark/50" aria-label="Live audio waveform" role="img" />;
}
