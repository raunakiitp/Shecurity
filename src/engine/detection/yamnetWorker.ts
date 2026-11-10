// YAMNet worker: loads TFJS + YAMNet from /models/yamnet, classifies 0.975s windows
import * as tf from '@tensorflow/tfjs';

// tf.loadGraphModel returns LayersModel | GraphModel — a union without a shared
// predict() signature, so type it minimally as the surface we actually use.
interface YAMNetModel {
  predict(input: tf.Tensor): tf.Tensor;
  execute(input: tf.Tensor): tf.Tensor;
}
let model: YAMNetModel | null = null;
let classNames: string[] = [];
let loading: Promise<void> | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data || {};
  if (type === 'load') {
    await ensureLoaded();
    (self as unknown as Worker).postMessage({ type: 'ready', classes: classNames.length });
  } else if (type === 'classify') {
    const { data, id } = e.data as { data: Float32Array; id: number };
    await ensureLoaded();
    const result = classify(data);
    (self as unknown as Worker).postMessage({ type: 'result', id, ...result });
  }
};

async function ensureLoaded(): Promise<void> {
  if (model) return;
  if (loading) return loading;
  loading = (async () => {
    await tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
    await tf.ready();
    // fetch class map CSV
    const csvResp = await fetch('/models/yamnet/yamnet_class_map.csv');
    const csv = await csvResp.text();
    classNames = parseClassMap(csv);
    model = (await tf.loadGraphModel('/models/yamnet/model.json')) as unknown as YAMNetModel;
    // warmup
    const warm = tf.zeros([1, 15600]);
    try {
      model.predict(warm);
    } catch {
      /* some graph models need executeAsync */
    }
    warm.dispose();
  })();
  return loading;
}

function parseClassMap(csv: string): string[] {
  // YAMNet class map CSV: index,name(quoted, may contain commas),...
  const names: string[] = [];
  const lines = csv.split(/\r?\n/);
  let headerSeen = false;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (!headerSeen && /index/i.test(line.split(',')[0])) {
      headerSeen = true;
      continue;
    }
    // name is the 2nd column, possibly quoted with commas inside
    const m = line.match(/^\s*\d+\s*,\s*"([^"]+)"|^\s*\d+\s*,\s*([^,]+)/);
    if (m) names.push((m[1] ?? m[2]).trim());
    else names.push('');
  }
  return names;
}

const WEIGHTS: Record<string, number> = {
  Screaming: 1.0,
  Yell: 0.9,
  Shout: 0.8,
  Bellow: 0.6,
  'Crying, sobbing': 0.4,
  Whimper: 0.4,
};

function classify(waveform: Float32Array) {
  const input = tf.tensor1d(Array.from(waveform.subarray(0, 15600)));
  if (!model) throw new Error("YAMNet model not loaded");
  let scores: tf.Tensor;
  try {
    scores = model.predict(input) as tf.Tensor;
  } catch {
    scores = model.execute(input) as tf.Tensor;
  }
  // YAMNet may return [1, N, 521] — reduce
  const shape = scores.shape;
  let data: Float32Array;
  if (shape.length >= 2) {
    // average over frames
    const reduced = tf.mean(scores as tf.Tensor2D, shape.length - 1 === 2 ? 0 : 1) as tf.Tensor1D;
    data = reduced.dataSync() as unknown as Float32Array;
    reduced.dispose();
  } else {
    data = scores.dataSync() as unknown as Float32Array;
  }
  const probs = data;
  input.dispose();
  scores.dispose();

  // weighted scream score by NAME lookup
  let screamScore = 0;
  const top: { idx: number; name: string; score: number }[] = [];
  for (let i = 0; i < probs.length; i++) {
    top.push({ idx: i, name: classNames[i] || `class-${i}`, score: probs[i] });
  }
  top.sort((a, b) => b.score - a.score);
  for (const [name, w] of Object.entries(WEIGHTS)) {
    const idx = classNames.indexOf(name);
    if (idx >= 0) screamScore = Math.max(screamScore, w * probs[idx]);
  }
  const top3 = top.slice(0, 3);
  return { screamScore, top3, all: null };
}
