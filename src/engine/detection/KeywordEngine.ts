// KeywordEngine: Web Speech API continuous recognition (optional, disclosed)
import { containsKeyword } from '../../lib/constants';

type SR = {
  new (): SpeechRecognitionLike;
};
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export class KeywordEngine {
  private rec: SpeechRecognitionLike | null = null;
  private shouldRun = false;
  private restartTimer: number | null = null;
  private lastHitAt = 0;
  running = false;
  supported = false;
  lang: 'hi-IN' | 'en-IN' = 'hi-IN';
  lastHeard = '';
  lastHit: string | null = null;

  private handlers: Record<string, Set<(...args: unknown[]) => void>> = {};
  on(evt: 'keyword' | 'error' | 'state', fn: (payload?: unknown) => void) {
    (this.handlers[evt] ||= new Set()).add(fn);
    return () => this.handlers[evt]?.delete(fn);
  }
  private emit(evt: string, ...args: unknown[]) {
    this.handlers[evt]?.forEach((f) => f(args[0]));
  }

  constructor() {
    const w = window as unknown as Record<string, unknown>;
    this.supported = Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  private createRec(): SpeechRecognitionLike | null {
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as SR | undefined;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript || '';
        if (text) {
          this.lastHeard = text;
          this.emit('state', { heard: text });
        }
        const hit = containsKeyword(text);
        if (hit && Date.now() - this.lastHitAt > 4000) {
          this.lastHitAt = Date.now();
          this.lastHit = hit.keyword;
          this.emit('keyword', { keyword: hit.keyword, text });
        }
      }
    };
    rec.onerror = (e: { error: string }) => {
      // 'not-allowed' → permission issue; 'no-speech' is normal
      if (e.error && e.error !== 'no-speech' && e.error !== 'aborted') {
        this.emit('error', e.error);
      }
    };
    rec.onend = () => {
      if (this.shouldRun) {
        // auto-restart
        this.restartTimer = window.setTimeout(() => {
          try {
            rec.start();
          } catch {
            /* already started */
          }
        }, 300);
      } else {
        this.running = false;
        this.emit('state', { running: false });
      }
    };
    return rec;
  }

  start(lang?: 'hi-IN' | 'en-IN') {
    if (!this.supported) return false;
    if (lang) this.lang = lang;
    this.shouldRun = true;
    if (!this.rec) this.rec = this.createRec();
    if (!this.rec) return false;
    try {
      this.rec.start();
      this.running = true;
      this.emit('state', { running: true });
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    this.shouldRun = false;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    try {
      this.rec?.abort();
    } catch {
      /* noop */
    }
    this.running = false;
    this.emit('state', { running: false });
  }
}
