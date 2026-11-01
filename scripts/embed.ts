// Builds public/meaning/: one vector per benchmark from Google's EmbeddingGemma 2 (Apache 2.0), so the home
// page search box can find benchmarks by what they test, not only by name. The browser embeds the query with
// the same model and ranks benchmarks by cosine similarity against these vectors.
//
// Each benchmark is embedded from its name, other names, description, note, maker and category, with the
// model's document prompt. Vectors are cut to the first DIM dimensions (the model is trained so that a
// prefix of its vector still works), normalised, and stored as int8 with one float32 scale per vector:
//   public/meaning/vectors.bin   N float32 scales, then N x DIM int8 values, rows in the order of index.json
//   public/meaning/index.json    model, dim, prompts, ids, and a hash of each benchmark's text
// A rerun embeds only benchmarks whose text changed, and drops ones no longer in data/benchmarks.json.
//
// The site itself has no dependency on the model library. Install it without saving, then run:
//   npm i --no-save @huggingface/transformers@4.3.1
//   node scripts/embed.ts [--all] [--dtype fp32|q8]
// Or point TRANSFORMERS_DIR at any folder where it is installed. The model (1.1 GB at fp32, 314 MB at q8)
// downloads once into .cache/transformers.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, dataPath, readJson, writeJson } from './lib/util.ts';

export const MODEL = 'onnx-community/embeddinggemma-2-ONNX';
export const DIM = 256;
export const QUERY_PROMPT = 'task: search result | query: ';
const args = process.argv.slice(2);
const ALL = args.includes('--all');
const DTYPE = args[args.indexOf('--dtype') + 1] && args.includes('--dtype') ? args[args.indexOf('--dtype') + 1] : 'fp32';
const RAW = args.includes('--raw') ? args[args.indexOf('--raw') + 1] : '';
const OUT = join(ROOT, 'public', 'meaning');

interface Bench {
  id: string;
  name: string;
  aliases?: string[];
  category?: string;
  subcategory?: string;
  description?: string;
  note?: string;
  org?: string;
}
interface Index {
  model: string;
  dtype: string;
  dim: number;
  built: string;
  query: string;
  ids: string[];
  hashes: string[];
}

// category names live in the site's taxonomy module, which Node cannot import (it imports JSON bare)
const taxSrc = readFileSync(join(ROOT, 'src', 'lib', 'taxonomy.ts'), 'utf8');
const CATEGORY = Object.fromEntries([...(taxSrc.match(/CATEGORY_NAMES[^{]*\{([^}]*)\}/)?.[1] ?? '').matchAll(/'([\w-]+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));
const SUB = Object.fromEntries(
  Object.values(readJson<{ subcategories: Record<string, { id: string; name: string }[]> }>(dataPath('taxonomy.json')).subcategories)
    .flat()
    .map((s) => [s.id, s.name]),
);

/** The text a benchmark is embedded from, after the document prompt's title. */
export function docText(b: Bench): string {
  const kind = [CATEGORY[b.category ?? ''] ?? b.category, SUB[b.subcategory ?? '']].filter(Boolean).join(', ');
  return [
    b.aliases?.length ? `Also called ${b.aliases.join(', ')}.` : '',
    b.description ?? '',
    b.note ?? '',
    b.org ? `Made by ${b.org}.` : '',
    kind ? `Category: ${kind}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
const docPrompt = (b: Bench) => `title: ${b.name} | text: ${docText(b)}`;
const hash = (s: string) => createHash('sha256').update(`${MODEL}|${DTYPE}|${s}`).digest('hex').slice(0, 10);

async function loadLib() {
  try {
    return await import('@huggingface/transformers');
  } catch {
    const dir = process.env.TRANSFORMERS_DIR;
    if (!dir) throw new Error('Install the model library first: npm i --no-save @huggingface/transformers@4.3.1 (or set TRANSFORMERS_DIR)');
    const req = createRequire(join(dir, 'package.json'));
    return await import(pathToFileURL(req.resolve('@huggingface/transformers')).href);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const benchmarks = readJson<Bench[]>(dataPath('benchmarks.json'));
  const old: Index | null = !ALL && existsSync(join(OUT, 'index.json')) ? readJson<Index>(join(OUT, 'index.json')) : null;
  const oldVec = old && old.dim === DIM && old.model === MODEL ? readFileSync(join(OUT, 'vectors.bin')) : null;
  const oldRow = new Map<string, { hash: string; i: number }>((old?.ids ?? []).map((id, i) => [id, { hash: old!.hashes[i], i }]));
  const texts = benchmarks.map(docPrompt);
  const hashes = texts.map(hash);
  const todo = benchmarks.map((b, i) => i).filter((i) => RAW || !oldVec || oldRow.get(benchmarks[i].id)?.hash !== hashes[i]);
  console.log(`${benchmarks.length} benchmarks, ${todo.length} to embed with ${MODEL} (${DTYPE})`);

  const N = benchmarks.length;
  const scales = new Float32Array(N);
  const q = new Int8Array(N * DIM);
  // keep the vectors of unchanged benchmarks
  if (oldVec) {
    const n0 = old!.ids.length;
    const s0 = new Float32Array(oldVec.buffer, oldVec.byteOffset, n0);
    const q0 = new Int8Array(oldVec.buffer, oldVec.byteOffset + n0 * 4, n0 * DIM);
    benchmarks.forEach((b, i) => {
      const o = oldRow.get(b.id);
      if (!o || o.hash !== hashes[i]) return;
      scales[i] = s0[o.i];
      q.set(q0.subarray(o.i * DIM, (o.i + 1) * DIM), i * DIM);
    });
  }

  if (todo.length) {
    const { AutoConfig, AutoModel, AutoTokenizer, env } = await loadLib();
    env.cacheDir = join(ROOT, '.cache', 'transformers');
    // text only: without these configs the vision and audio encoders are never downloaded
    const config = await AutoConfig.from_pretrained(MODEL);
    config.vision_config = config.audio_config = null;
    const model = await AutoModel.from_pretrained(MODEL, { config, dtype: DTYPE, device: 'cpu' });
    const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
    const raw = RAW ? new Float32Array(N * 768) : null;
    const t0 = Date.now();
    const BATCH = 16;
    for (let k = 0; k < todo.length; k += BATCH) {
      const rows = todo.slice(k, k + BATCH);
      const inputs = await tokenizer(
        rows.map((i) => texts[i]),
        { padding: true, truncation: true, max_length: 512 },
      );
      const { sentence_embedding } = await model(inputs);
      const full = sentence_embedding.data as Float32Array;
      const D = sentence_embedding.dims[1];
      rows.forEach((i, j) => {
        const v = full.subarray(j * D, (j + 1) * D);
        if (raw) raw.set(v, i * 768);
        // first DIM dimensions, normalised, then int8 with this vector's own scale
        let norm = 0;
        for (let d = 0; d < DIM; d++) norm += v[d] * v[d];
        norm = Math.sqrt(norm) || 1;
        let max = 0;
        for (let d = 0; d < DIM; d++) max = Math.max(max, Math.abs(v[d] / norm));
        scales[i] = max / 127;
        for (let d = 0; d < DIM; d++) q[i * DIM + d] = Math.round(v[d] / norm / scales[i]);
      });
      if ((k / BATCH) % 10 === 0) console.log(`  ${Math.min(k + BATCH, todo.length)} of ${todo.length}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    if (raw) {
      writeFileSync(RAW, Buffer.from(raw.buffer));
      writeJson(`${RAW}.ids.json`, benchmarks.map((b) => b.id));
    }
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'vectors.bin'), Buffer.concat([Buffer.from(scales.buffer), Buffer.from(q.buffer)]));
  const index: Index = { model: MODEL, dtype: DTYPE, dim: DIM, built: new Date().toISOString().slice(0, 10), query: QUERY_PROMPT, ids: benchmarks.map((b) => b.id), hashes };
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
  console.log(`wrote public/meaning: ${N} vectors of ${DIM} dimensions, ${((N * (DIM + 4)) / 1024).toFixed(0)} KB`);
}
