// Downloads the YAMNet TFJS model + class map into public/models/yamnet/
// so the app never depends on a third-party URL at demo time (works offline).
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'models', 'yamnet');
const MODEL_URL =
  'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1/model.json?tfjs-format=file';
const CLASS_MAP_URL =
  'https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv';

async function download(url, dest, binary = false) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`✓ ${path.relative(process.cwd(), dest)} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const res = await fetch(MODEL_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for model.json`);
  const modelJson = await res.json();

  await writeFile(path.join(OUT, 'model.json'), JSON.stringify(modelJson));
  console.log(`✓ public/models/yamnet/model.json`);

  const shards = modelJson.weightsManifest?.flatMap((m) => m.paths) || [];
  for (const shard of shards) {
    const url = new URL(shard, 'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1/').href;
    await download(url, path.join(OUT, shard), true);
  }

  await download(CLASS_MAP_URL, path.join(OUT, 'yamnet_class_map.csv'));
  console.log('\nYAMNet model ready in public/models/yamnet — fully offline from now on.');
}

main().catch((err) => {
  console.error('fetch-model failed:', err.message);
  process.exit(1);
});
