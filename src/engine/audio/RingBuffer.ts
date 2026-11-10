// Rolling 30-second Float32 PCM ring buffer (black box pre-roll)
export class RingBuffer {
  private buf: Float32Array;
  private writePos = 0;
  private filled = 0;
  readonly capacity: number;

  constructor(seconds: number, sampleRate: number) {
    this.capacity = Math.round(seconds * sampleRate);
    this.buf = new Float32Array(this.capacity);
  }

  write(data: Float32Array) {
    const n = data.length;
    if (n >= this.capacity) {
      this.buf.set(data.subarray(n - this.capacity));
      this.writePos = 0;
      this.filled = this.capacity;
      return;
    }
    const tail = Math.min(n, this.capacity - this.writePos);
    this.buf.set(data.subarray(0, tail), this.writePos);
    if (tail < n) this.buf.set(data.subarray(tail), 0);
    this.writePos = (this.writePos + n) % this.capacity;
    this.filled = Math.min(this.capacity, this.filled + n);
  }

  /** Read out the oldest→newest contiguous samples */
  read(): Float32Array {
    const out = new Float32Array(this.filled);
    const start = this.filled < this.capacity ? 0 : this.writePos;
    const first = Math.min(this.filled, this.capacity - start);
    out.set(this.buf.subarray(start, start + first), 0);
    if (first < this.filled) out.set(this.buf.subarray(0, this.filled - first), first);
    return out;
  }

  get seconds(): number {
    return this.filled / (this.capacity / 30);
  }

  clear() {
    this.writePos = 0;
    this.filled = 0;
  }
}
