// Safe expression parser (precedence climbing). NO eval(), no Function().
// Supports: digits, decimals, + - × ÷ % ± (as unary minus in parser input), parentheses.

type Token = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: 'paren'; v: '(' | ')' };

export function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const raw = input.slice(i, j);
      if ((raw.match(/\./g) || []).length > 1) return null;
      tokens.push({ t: 'num', v: parseFloat(raw) });
      i = j;
      continue;
    }
    if ('+-×÷*/'.includes(c)) {
      tokens.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({ t: 'paren', v: c });
      i++;
      continue;
    }
    return null; // unknown char
  }
  return tokens;
}

export function evaluateExpression(input: string): number | null {
  const tokens = tokenize(input);
  if (!tokens || tokens.length === 0) return null;
  let pos = 0;

  const peek = () => tokens[pos];

  function parseExpr(): number | null {
    // expr := term (('+'|'-') term)*
    let left = parseTerm();
    if (left === null) return null;
    while (peek() && peek().t === 'op' && ((peek() as { v: string }).v === '+' || (peek() as { v: string }).v === '-')) {
      const op = (peek() as { v: string }).v;
      pos++;
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    // term := factor (('×'|'÷'|'*'|'/') factor)*
    let left = parseFactor();
    if (left === null) return null;
    while (
      peek() &&
      peek().t === 'op' &&
      ['×', '÷', '*', '/'].includes((peek() as { v: string }).v)
    ) {
      const op = (peek() as { v: string }).v;
      pos++;
      const right = parseFactor();
      if (right === null) return null;
      if ((op === '÷' || op === '/') && right === 0) return null; // div by zero → error
      left = op === '×' || op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number | null {
    // factor := ('-'|'+') factor | primary ('%')?
    const tk = peek();
    if (!tk) return null;
    if (tk.t === 'op' && (tk.v === '-' || tk.v === '+')) {
      pos++;
      const v = parseFactor();
      if (v === null) return null;
      return tk.v === '-' ? -v : v;
    }
    let base = parsePrimary();
    if (base === null) return null;
    // percent postfix: 50% → 0.5 (calculator style: x% of nothing = x/100)
    while (peek() && peek().t === 'op' && peek().v === '%') {
      pos++;
      base = base / 100;
    }
    return base;
  }

  function parsePrimary(): number | null {
    const tk = peek();
    if (!tk) return null;
    if (tk.t === 'num') {
      pos++;
      return tk.v;
    }
    if (tk.t === 'paren' && tk.v === '(') {
      pos++;
      const v = parseExpr();
      if (v === null) return null;
      const close = peek();
      if (close && close.t === 'paren' && close.v === ')') {
        pos++;
        return v;
      }
      return null;
    }
    return null;
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length) return null;
  if (!isFinite(result)) return null;
  return result;
}

/** Format a float for the calculator display (up to 10 significant digits). */
export function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e12) return String(n);
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}
