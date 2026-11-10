export const RELATIONS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Partner',
  'Friend',
  'Roommate',
  'Colleague',
  'Other',
];

export const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
];

export const EMERGENCY_NUMBERS = [
  { label: 'Police', number: '112', icon: 'shield' },
  { label: 'Women Helpline', number: '1091', icon: 'heart' },
  { label: 'Emergency Management', number: '181', icon: 'lifebuoy' },
  { label: 'Ambulance', number: '100', icon: 'siren' },
];

export const KEYWORDS = [
  // Hinglish / Hindi (latin)
  'bachao',
  'bachaao',
  'bachavo',
  'help',
  'help me',
  'chhod do',
  'chhodo',
  'chhodo mujhe',
  'mat karo',
  'leave me',
  'leave me alone',
  'stop',
  'police',
  'bhaiya mat',
  'nahi',
  // Devanagari
  'बचाओ',
  'छोड़ दो',
  'छोड़ो',
  'मदद',
  'मत करो',
  'पुलिस',
];

// fuzzy-normalize: lowercase, strip diacritics/punctuation, collapse spaces
export function normalizeSpeech(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\s,]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// simple fuzzy contains with edit-distance tolerance for short words
export function containsKeyword(text: string): { hit: string; keyword: string } | null {
  const norm = normalizeSpeech(text);
  if (!norm) return null;
  for (const kw of KEYWORDS) {
    const k = normalizeSpeech(kw);
    if (!k) continue;
    if (norm.includes(k)) return { hit: text, keyword: kw };
  }
  // fuzzy: token-level levenshtein <=1 for kws >=4 chars
  const tokens = norm.split(' ');
  for (const kw of KEYWORDS) {
    const k = normalizeSpeech(kw);
    if (k.length < 4 || k.includes(' ')) continue;
    for (const t of tokens) {
      if (Math.abs(t.length - k.length) > 1) continue;
      if (levenshtein(t, k) <= 1) return { hit: text, keyword: kw };
    }
  }
  return null;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}
