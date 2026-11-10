// AudioEngine: getUserMedia → AudioWorklet → 16k mono PCM
// Events: 'pcm' (rolling buffer), 'window' (0.975s for YAMNet), 'level' (RMS for waveform)

export type AudioEngineEvents = {
  pcm: (data: Float32Array) => void;
  window: (data: Float32Array) => void;
  level: (rms: number, peak: number) => void;
};

type Listener = (payload?: unknown) => void;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private levelTimer: number | null = null;
  private handlers: Record<keyof AudioEngineEvents, Set<Listener> | undefined> = {
    pcm: undefined,
    window: undefined,
    level: undefined,
  };
  running = false;
  usingWorklet = false;
  sampleRate = 16000;

  on<K extends keyof AudioEngineEvents>(evt: K, fn: AudioEngineEvents[K]) {
    const set = (this.handlers[evt] ||= new Set());
    set.add(fn as Listener);
    return () => set.delete(fn as Listener);
  }

  private emit<K extends keyof AudioEngineEvents>(evt: K, ...args: Parameters<AudioEngineEvents[K]>) {
    this.handlers[evt]?.forEach((fn) => (fn as (...a: unknown[]) => void)(...args));
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.ctx = new AudioContext();
    await this.ctx.resume();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.source.connect(this.analyser);

    const workletURL = new URL('/audio-worklet.js', window.location.origin).href;
    try {
      await this.ctx.audioWorklet.addModule(workletURL);
      this.worklet = new AudioWorkletNode(this.ctx, 'shecurity-worklet');
      this.worklet.port.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === 'pcm') this.emit('pcm', data as Float32Array);
        else if (type === 'window') this.emit('window', data as Float32Array);
      };
      this.source.connect(this.worklet);
      this.usingWorklet = true;
    } catch {
      // Fallback: ScriptProcessor
      this.scriptNode = this.ctx.createScriptProcessor(4096, 1, 1);
      const ratio = this.ctx.sampleRate / this.sampleRate;
      let resamplePos = 0;
      let prev = 0;
      let winFill = 0;
      let win = new Float32Array(15600);
      let chunk: number[] = [];
      this.scriptNode.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          while (resamplePos < 1) {
            const s = prev + (input[i] - prev) * resamplePos;
            chunk.push(s);
            if (chunk.length >= 1600) {
              this.emit('pcm', new Float32Array(chunk));
              chunk = [];
            }
            win[winFill++] = s;
            if (winFill >= win.length) {
              this.emit('window', win);
              win = new Float32Array(15600);
              winFill = 0;
            }
            resamplePos += ratio;
          }
          resamplePos -= 1;
          prev = input[i];
        }
      };
      this.source.connect(this.scriptNode);
      // ScriptProcessor needs a destination connection in some browsers
      const silent = this.ctx.createGain();
      silent.gain.value = 0;
      this.scriptNode.connect(silent);
      silent.connect(this.ctx.destination);
    }

    // level metering loop (rAF-safe: only when document visible)
    const buf = new Float32Array(1024);
    const tick = () => {
      if (!this.running || !this.analyser) return;
      if (!document.hidden) {
        this.analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          sum += buf[i] * buf[i];
          const a = Math.abs(buf[i]);
          if (a > peak) peak = a;
        }
        this.emit('level', Math.sqrt(sum / buf.length), peak);
      }
      this.levelTimer = requestAnimationFrame(tick);
    };
    this.running = true;
    this.levelTimer = requestAnimationFrame(tick);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.levelTimer) cancelAnimationFrame(this.levelTimer);
    this.levelTimer = null;
    try {
      this.worklet?.disconnect();
      this.scriptNode?.disconnect();
      this.source?.disconnect();
    } catch {
      /* noop */
    }
    this.worklet = null;
    this.scriptNode = null;
    this.source = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx && this.ctx.state !== 'closed') await this.ctx.close();
    this.ctx = null;
    this.analyser = null;
  }

  getLevel(): { rms: number; peak: number } {
    if (!this.analyser) return { rms: 0, peak: 0 };
    const buf = new Float32Array(1024);
    this.analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buf.length; i++) {
      sum += buf[i] * buf[i];
      const a = Math.abs(buf[i]);
      if (a > peak) peak = a;
    }
    return { rms: Math.sqrt(sum / buf.length), peak };
  }
}
