// Search by meaning, for the home page search box. Google's EmbeddingGemma 2 (Apache 2.0) turns the query
// into a vector on the reader's own device, and the benchmarks are ranked by cosine similarity against
// vectors made ahead of time by scripts/embed.ts (public/meaning/).
//
// Nothing heavy loads until someone asks for it. Then a module worker loads transformers.js from jsDelivr
// and the text part of the model from Hugging Face (about 210 MB the first time, from the browser's cache
// after that). The worker also holds the vectors and does the ranking, so typing never waits on any of it.
// It needs WebGPU. A browser without it gets name search only.
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';
/** What the first use downloads: the 4-bit text model (175 MB), its tokenizer (32 MB) and the runtime. */
export const MEANING_MB = 210;
// WebGPU is needed: the WebAssembly runtime has no kernel for the quantized token table that both the
// 4-bit and 8-bit builds use, and the full-precision build is 1.1 GB. probeGpu() asks once, at the first
// sign that someone will search, and the offer shows only where a GPU adapter answered.
let gpu: boolean | null = null;
export function probeGpu(answered: () => void) {
  if (gpu !== null) return;
  const nav = navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } };
  if (!nav.gpu) {
    gpu = false;
    return;
  }
  gpu = false;
  nav.gpu.requestAdapter().then(
    (a) => {
      gpu = !!a;
      if (gpu) answered();
    },
    () => (gpu = false),
  );
}
export const meaningPossible = () => gpu === true;
const KEY = 'almanac-meaning';

export type MeaningState = 'off' | 'loading' | 'ready' | 'failed';
interface Index {
  model: string;
  dim: number;
  query: string;
  ids: string[];
}

// The worker: loads the model once, keeps the vectors, and answers each query with the closest benchmarks.
const workerCode = (model: string) => `
import { AutoConfig, AutoModel, AutoTokenizer, env } from '${LIB}';
env.allowLocalModels = false;
let ready = null, scales = null, vecs = null, dim = 0;
async function load() {
  const files = {};
  const progress_callback = (p) => {
    if (p.status !== 'progress' || !p.total) return;
    files[p.file] = [p.loaded, p.total];
    let a = 0, b = 0;
    for (const [x, y] of Object.values(files)) { a += x; b += y; }
    postMessage({ type: 'progress', loaded: a, total: b });
  };
  let adapter = null;
  try { adapter = navigator.gpu && (await navigator.gpu.requestAdapter()); } catch {}
  if (!adapter) throw new Error('It needs WebGPU, which this browser has turned off');
  const device = 'webgpu';
  const config = await AutoConfig.from_pretrained('${model}', { progress_callback });
  // text only: the vision and audio encoders never download
  config.vision_config = config.audio_config = null;
  const [tokenizer, net] = await Promise.all([
    AutoTokenizer.from_pretrained('${model}', { progress_callback }),
    AutoModel.from_pretrained('${model}', { config, device, dtype: 'q4', progress_callback }),
  ]);
  return { tokenizer, net, device };
}
onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      dim = m.dim;
      scales = new Float32Array(m.bin, 0, m.n);
      vecs = new Int8Array(m.bin, m.n * 4, m.n * dim);
    }
    ready ??= load();
    const { tokenizer, net, device } = await ready;
    if (m.type === 'load') return postMessage({ type: 'ready', device });
    const t0 = performance.now();
    const { sentence_embedding } = await net(await tokenizer([m.text]));
    const q = Float32Array.from(sentence_embedding.data.subarray(0, dim));
    let n = 0;
    for (const x of q) n += x * x;
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < dim; i++) q[i] /= n;
    // cosine against every benchmark, keeping the best k
    const k = m.k, top = [];
    for (let i = 0; i < scales.length; i++) {
      let dot = 0;
      const o = i * dim;
      for (let d = 0; d < dim; d++) dot += q[d] * vecs[o + d];
      const s = dot * scales[i];
      if (top.length < k || s > top[top.length - 1][1]) {
        top.push([i, s]);
        top.sort((a, b) => b[1] - a[1]);
        if (top.length > k) top.pop();
      }
    }
    postMessage({ type: 'top', id: m.id, top, ms: performance.now() - t0 });
  } catch (err) {
    if (m.type === 'load') ready = null;
    postMessage({ type: 'error', id: m.type === 'load' ? undefined : m.id, message: String((err && err.message) || err) });
  }
};`;

export class Meaning {
  state: MeaningState = 'off';
  loaded = 0;
  total = 0;
  device = '';
  error = '';
  private worker?: Worker;
  private ids: string[] = [];
  private query = '';
  private seq = 0;
  private waiting = new Map<number, (top: [number, number][] | null) => void>();
  private boot?: { ok: () => void; fail: (e: Error) => void };

  constructor(private changed: () => void) {}

  /** True once this browser has used meaning search, so later visits start it without asking. */
  static remembered(): boolean {
    try {
      return localStorage.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  }

  async start() {
    if (this.state === 'loading' || this.state === 'ready') return;
    this.state = 'loading';
    this.error = '';
    this.changed();
    performance.mark('meaning-start');
    try {
      const [index, bin] = await Promise.all([
        fetch('/meaning/index.json').then((r) => (r.ok ? (r.json() as Promise<Index>) : Promise.reject(new Error(`index ${r.status}`)))),
        fetch('/meaning/vectors.bin').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`vectors ${r.status}`)))),
      ]);
      this.ids = index.ids;
      this.query = index.query;
      const url = URL.createObjectURL(new Blob([workerCode(index.model)], { type: 'text/javascript' }));
      this.worker = new Worker(url, { type: 'module' });
      this.worker.onmessage = (e) => this.message(e.data);
      this.worker.onerror = (e) => this.boot?.fail(new Error(e.message || 'The model did not load'));
      await new Promise<void>((ok, fail) => {
        this.boot = { ok, fail };
        this.worker!.postMessage({ type: 'load', bin, n: index.ids.length, dim: index.dim }, [bin]);
      });
      this.state = 'ready';
      performance.measure('meaning-load', 'meaning-start');
      try {
        localStorage.setItem(KEY, 'on');
      } catch {
        /* private window: the reader starts it from the list next time */
      }
    } catch (e) {
      this.state = 'failed';
      this.error = (e as Error).message ?? String(e);
      this.worker?.terminate();
      this.worker = undefined;
    }
    this.changed();
  }

  private message(m: { type: string; id?: number; top?: [number, number][]; loaded?: number; total?: number; device?: string; message?: string; ms?: number }) {
    if (m.type === 'progress') {
      this.loaded = m.loaded!;
      this.total = m.total!;
      this.changed();
    } else if (m.type === 'ready') {
      this.device = m.device!;
      this.boot?.ok();
    } else if (m.type === 'top') {
      const now = performance.now();
      performance.measure('meaning-query', { start: now - (m.ms ?? 0), end: now });
      this.waiting.get(m.id!)?.(m.top!);
      this.waiting.delete(m.id!);
    } else if (m.type === 'error') {
      if (m.id === undefined) this.boot?.fail(new Error(m.message));
      else {
        this.waiting.get(m.id)?.(null);
        this.waiting.delete(m.id);
      }
    }
  }

  /** The k benchmarks closest in meaning to the text, best first, or null if the model failed. */
  search(text: string, k: number): Promise<{ id: string; s: number }[] | null> {
    if (this.state !== 'ready' || !this.worker) return Promise.resolve(null);
    const id = ++this.seq;
    return new Promise((done) => {
      this.waiting.set(id, (top) => done(top && top.map(([i, s]) => ({ id: this.ids[i], s }))));
      this.worker!.postMessage({ type: 'search', id, k, text: this.query + text });
    });
  }
}
