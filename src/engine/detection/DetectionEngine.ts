// DetectionEngine: YAMNet worker orchestration + EMA smoothing + threshold + cooldown
import type { DangerZone, Sensitivity, YamnetProbs } from '../../lib/types';
import { THRESHOLDS } from '../../lib/types';
import YamnetWorker from './yamnetWorker?worker';

export interface DetectionConfig {
  sensitivity: Sensitivity;
}

export class DetectionEngine {
  private worker: Worker | null = null;
  private busy = false;
  private windowId = 0;
  private consecutive = 0;
  private lastAlertAt = 0;
  ema = 0;
  ready = false;
  modelError: string | null = null;
  threshold = THRESHOLDS.medium;
  top3: YamnetProbs['top'] = [];
  rawScore = 0;

  private handlers: Record<string, Set<(payload?: unknown) => void>> = {};
  on(evt: 'score' | 'trigger' | 'ready' | 'error', fn: (payload?: unknown) => void) {
    (this.handlers[evt] ||= new Set()).add(fn);
    return () => this.handlers[evt]?.delete(fn);
  }
  private emit(evt: string, ...args: unknown[]) {
    this.handlers[evt]?.forEach((f) => f(args[0]));
  }

  async loadModel(): Promise<void> {
    if (this.ready) return;
    this.modelError = null;
    this.worker = new YamnetWorker();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Model load timed out'));
      }, 60000);
      this.worker!.onmessage = (e) => {
        const { type } = e.data;
        if (type === 'ready') {
          clearTimeout(timeout);
          this.ready = true;
          this.emit('ready');
          resolve();
        }
      };
      this.worker!.onerror = (err) => {
        clearTimeout(timeout);
        this.modelError = err.message || 'Failed to load model';
        this.emit('error', this.modelError);
        reject(new Error(this.modelError));
      };
      this.worker!.postMessage({ type: 'load' });
    });
  }

  setSensitivity(s: Sensitivity) {
    this.threshold = THRESHOLDS[s];
  }

  get cooldownActive(): boolean {
    return Date.now() - this.lastAlertAt < 30_000;
  }

  markAlert() {
    this.lastAlertAt = Date.now();
    this.consecutive = 0;
  }

  /** Feed a 0.975s window of 16k mono samples */
  async classifyWindow(data: Float32Array) {
    if (!this.worker || this.busy) return;
    this.busy = true;
    const id = ++this.windowId;
    try {
      this.worker.postMessage({ type: 'classify', data, id }, [data.buffer]);
      const result = await new Promise<YamnetProbs>((resolve) => {
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'result' && e.data.id === id) {
            this.worker!.removeEventListener('message', handler);
            resolve(e.data as YamnetProbs);
          }
        };
        this.worker!.addEventListener('message', handler);
      });
      this.rawScore = result.screamScore;
      this.top3 = result.top;
      // EMA smoothing
      this.ema = 0.35 * result.screamScore + 0.65 * this.ema;
      this.emit('score', {
        ema: this.ema,
        raw: this.rawScore,
        top3: this.top3,
      });
      this.evaluate();
    } finally {
      this.busy = false;
    }
  }

  private evaluate() {
    if (this.cooldownActive) return;
    if (this.ema >= this.threshold) {
      this.consecutive++;
      if (this.consecutive >= 2) {
        this.consecutive = 0;
        this.emit('trigger', { score: this.ema, source: 'scream' });
      }
    } else {
      this.consecutive = 0;
    }
  }

  zone(score: number): DangerZone {
    if (score <= 0.3) return 'safe';
    if (score <= 0.6) return 'watch';
    return 'danger';
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }
}
