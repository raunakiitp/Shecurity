// Siren via Web Audio oscillators
export class Siren {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private timer: number | null = null;
  playing = false;

  start(volume = 0.5) {
    if (this.playing) return;
    this.ctx = new AudioContext();
    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = volume;
    // siren sweep between 600-1100 Hz, classic wail via LFO
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 850;
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = 0.9;
    this.lfo.type = 'triangle';
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.osc.frequency);
    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.osc.start();
    this.lfo.start();
    this.playing = true;
    // unlock on first gesture if suspended
    if (this.ctx.state === 'suspended') {
      const resume = () => {
        this.ctx?.resume();
        window.removeEventListener('pointerdown', resume);
      };
      window.addEventListener('pointerdown', resume);
    }
  }

  stop() {
    if (!this.playing) return;
    try {
      this.osc?.stop();
      this.lfo?.stop();
      this.ctx?.close();
    } catch {
      /* noop */
    }
    this.osc = null;
    this.lfo = null;
    this.gain = null;
    this.ctx = null;
    this.playing = false;
    if (this.timer) clearTimeout(this.timer);
  }
}

export function vibrate(pattern: number[] | number) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
}
