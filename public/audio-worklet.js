// shecurity-worklet: AudioWorkletProcessor
// - mixdown stereo→mono
// - linear resample to 16 kHz
// - posts 0.975s windows (15600 samples) with 0.3s hop to main thread
// - posts raw 16k PCM chunks for the rolling black-box buffer
class ShecurityProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.ratio = sampleRate / this.targetRate;
    this.resamplePos = 0; // fractional position in input frames
    this.prevL = 0;
    this.prevR = 0;
    this.window = new Float32Array(15600); // 0.975s @ 16k
    this.windowFill = 0;
    this.hopCounter = 0;
    this.hopEvery = 4800; // 0.3s @ 16k
    this.pendingWindow = null;
    this.pcmChunk = [];
    this.pcmChunkFill = 0;
    this.chunkSize = 1600; // 0.1s @ 16k
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const chL = input[0];
    const chR = input.length > 1 ? input[1] : null;
    const n = chL.length;

    for (let i = 0; i < n; i++) {
      const l = chL[i];
      const r = chR ? chR[i] : l;
      // resample: linear interpolation between prev and current frame
      while (this.resamplePos < 1) {
        const s = this.prevL + (l - this.prevL) * this.resamplePos;
        this.pushSample(s);
        this.resamplePos += this.ratio;
      }
      this.resamplePos -= 1;
      this.prevL = l;
    }
    return true;
  }

  pushSample(s) {
    // black-box PCM chunk
    this.pcmChunk.push(s);
    this.pcmChunkFill++;
    if (this.pcmChunkFill >= this.chunkSize) {
      const out = new Float32Array(this.pcmChunk);
      this.port.postMessage({ type: 'pcm', data: out }, [out.buffer]);
      this.pcmChunk = [];
      this.pcmChunkFill = 0;
    }

    // detection window
    this.window[this.windowFill++] = s;
    if (this.windowFill >= this.window.length) {
      const out = new Float32Array(this.window);
      this.port.postMessage({ type: 'window', data: out }, [out.buffer]);
      this.windowFill = 0;
    }
  }
}

registerProcessor('shecurity-worklet', ShecurityProcessor);
