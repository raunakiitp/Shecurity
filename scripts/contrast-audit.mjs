// WCAG contrast audit: computes ratios for the token pairs used in the dark app UI.
// AA: 4.5:1 normal text, 3:1 large text (>=24px or >=18.66px bold) and icons/graphics.
function lum(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function blend(fg, bg, alpha) {
  const p = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  const [fr, fgn, fb] = p(fg);
  const [br, bgn, bb] = p(bg);
  const mix = (f, b) => Math.round(f * alpha + b * (1 - alpha));
  return '#' + [mix(fr, br), mix(fgn, bgn), mix(fb, bb)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const INK = '#14213D';
const SURFACE = '#1F2E4D';
const PAPER = '#F7F4EE';
const MIST = '#B4BCCB';
const STEEL = '#9AA5BC';
const LINE_DARK = '#6B7BA6';
const TEAL_LIGHT_OLD = '#2A9D8F';
const TEAL_LIGHT_NEW = '#3FBFAE';
const CORAL = '#D1495B';
const CORAL_LIGHT = '#F2A0AB';
const AMBER = '#E9A23B';
const TEAL = '#1F7A6D';

const rows = [];
const add = (name, fg, bg, need) => {
  const r = ratio(fg, bg);
  rows.push({ name, fg, bg, ratio: r.toFixed(2), need, pass: r >= need });
};

// ---- BEFORE: failing pairs found in the audit ----
add('BEFORE paper@50% on surface (text-paper/50)', blend(PAPER, SURFACE, 0.5), SURFACE, 4.5);
add('BEFORE paper@40% on surface (text-paper/40)', blend(PAPER, SURFACE, 0.4), SURFACE, 4.5);
add('BEFORE paper@60% on ink (text-paper/60)', blend(PAPER, INK, 0.6), INK, 4.5);
add('BEFORE teal-light(old) text on surface', TEAL_LIGHT_OLD, SURFACE, 4.5);
add('BEFORE coral text on surface (errors/badges)', CORAL, SURFACE, 4.5);
add('BEFORE muted(light) text on surface', '#5B6475', SURFACE, 4.5);
add('BEFORE white@80% on teal (alert small text)', blend('#FFFFFF', TEAL, 0.8), TEAL, 4.5);
add('BEFORE slate-600 toggle-off track on surface', '#475569', SURFACE, 3);

// ---- AFTER: new token pairs ----
add('AFTER mist text on ink', MIST, INK, 4.5);
add('AFTER mist text on surface', MIST, SURFACE, 4.5);
add('AFTER paper text on surface', PAPER, SURFACE, 4.5);
add('AFTER paper text on ink', PAPER, INK, 4.5);
add('AFTER steel icons/placeholder on surface', STEEL, SURFACE, 3);
add('AFTER steel icons on ink', STEEL, INK, 3);
add('AFTER lineDark borders on surface (#6B7BA6)', '#6B7BA6', SURFACE, 3);
add('AFTER lineDark borders on ink (#6B7BA6)', '#6B7BA6', INK, 3);
add('AFTER teal-light(new) text on surface', TEAL_LIGHT_NEW, SURFACE, 4.5);
add('AFTER teal-light(new) text on ink', TEAL_LIGHT_NEW, INK, 4.5);
add('AFTER coral-light text on surface', CORAL_LIGHT, SURFACE, 4.5);
add('AFTER coral-light text on ink', CORAL_LIGHT, INK, 4.5);
add('AFTER amber text on surface', AMBER, SURFACE, 4.5);
add('AFTER amber text on ink', AMBER, INK, 4.5);
add('AFTER toggle-off knob (white) vs track (slate-500 on surface)', '#FFFFFF', blend(SURFACE, '#64748B', 1), 3);
add('AFTER white on teal (buttons/alert bg)', '#FFFFFF', TEAL, 4.5);
add('AFTER white on coral: countdown digits/labels are LARGE text (3:1)', '#FFFFFF', CORAL, 3);
add('AFTER white@90% on teal (small text)', blend('#FFFFFF', TEAL, 0.9), TEAL, 4.5);

let fail = 0;
console.log('pair'.padEnd(52), 'fg'.padEnd(9), 'bg'.padEnd(9), 'ratio', 'need', 'pass');
for (const r of rows) {
  if (!r.pass) fail++;
  console.log(
    (r.pass ? '  ' : '! ') + r.name.padEnd(50),
    r.fg.padEnd(9),
    r.bg.padEnd(9),
    String(r.ratio).padEnd(5),
    String(r.need).padEnd(4),
    r.pass ? 'OK' : 'FAIL',
  );
}
console.log(fail === 0 ? '\nALL PAIRS PASS' : `\n${fail} PAIRS FAIL`);
