// Ranking for search by meaning, shared by the Build an index picker (in the browser) and the eval in
// scripts/meaning-eval.ts (in Node), so the test measures what readers get. It has no data imports.
//
// A benchmark's score is the cosine between the request and its vector (public/meaning/), plus a small word
// score: how many of the request's rarer words its description and abstract use (BM25). Similarities from the
// embedding model bunch in a narrow band (about 0.74 to 0.81), so a few shared words can break ties that the
// vector alone gets wrong. Versions of one benchmark fold into one result: the best-scoring version stands for
// its family.

// Weights chosen on the dev requests in scripts/meaning/queries.json with scripts/meaning-eval.ts, and checked on
// the held-out ones.
/** How much the word score counts next to the cosine. */
export const WORD_WEIGHT = 0.1;
/** How much a benchmark gains per log of its scored models: an index needs tests that many models have taken. */
export const PRIOR_WEIGHT = 0.02;
/** How many picks may share the first word of their names. */
export const STEM_CAP = 3;
/** How much a name match counts in the score without the model. */
export const NAME_WEIGHT = 0.5;

/** The lift a benchmark with this many scored models gets. */
export const prior = (models: number, weight = PRIOR_WEIGHT) => weight * Math.log1p(models);

/** Vectors as scripts/embed.ts writes them: one float32 scale per row, then int8 values, row by row. */
export interface Vectors {
  ids: string[];
  dim: number;
  scales: Float32Array;
  q: Int8Array;
}

export function readVectors(index: { ids: string[]; dim: number }, buf: ArrayBuffer, byteOffset = 0): Vectors {
  const n = index.ids.length;
  return {
    ids: index.ids,
    dim: index.dim,
    scales: new Float32Array(buf, byteOffset, n),
    q: new Int8Array(buf, byteOffset + n * 4, n * index.dim),
  };
}

/** Cosine similarity of a query vector (any length, cut to the stored dimensions) with every benchmark. */
export function cosines(v: Vectors, query: ArrayLike<number>): Float32Array {
  const d = v.dim;
  const q = new Float32Array(d);
  let n = 0;
  for (let i = 0; i < d; i++) n += query[i] * query[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < d; i++) q[i] = query[i] / n;
  const out = new Float32Array(v.ids.length);
  for (let r = 0; r < v.ids.length; r++) {
    let dot = 0;
    const o = r * d;
    for (let i = 0; i < d; i++) dot += q[i] * v.q[o + i];
    out[r] = dot * v.scales[r];
  }
  return out;
}

// ---- words ----------------------------------------------------------------------------------------
// Common English words, and words every benchmark description uses, carry no signal.
const STOP = new Set(
  (
    'a an and are as at be been but by can do does for from has have how i if in into is it its like me my more most of on or ' +
    'our out so such than that the their them then there these they this those to up us was we well were what when where which ' +
    'who will with would you your about across all also any each other over very real really good better best get gets ' +
    'model models benchmark benchmarks test tests task tasks score scores scored scoring measure measures evaluate evaluates ' +
    'evaluation evaluating ai llm llms language large ability abilities performance using use used based new set sets want ' +
    'care whether much many one two three'
  ).split(' '),
);

/** Lowercase words, without stop words, with a light plural and suffix trim so "contracts" meets "contract". */
export function words(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().normalize('NFKD').split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOP.has(raw)) continue;
    out.push(stem(raw));
  }
  return out;
}

function stem(w: string): string {
  if (w.length > 5 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('es') && /(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) return w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ed')) return w.slice(0, -2);
  return w;
}

/**
 * A small word index for BM25: for each word, the rows that use it and how often, plus each row's length.
 * Stored as plain arrays so the page can ship it as JSON.
 */
export interface Lexicon {
  /** word -> [row, count, row, count, ...] */
  post: Record<string, number[]>;
  len: number[];
}

export function buildLexicon(texts: string[]): Lexicon {
  const post: Record<string, number[]> = {};
  const len: number[] = [];
  texts.forEach((t, r) => {
    const ws = words(t);
    len.push(ws.length);
    const c = new Map<string, number>();
    for (const w of ws) c.set(w, (c.get(w) ?? 0) + 1);
    for (const [w, k] of c) (post[w] ??= []).push(r, k);
  });
  return { post, len };
}

/** BM25 of the request against every row, scaled so the best row gets 1 (all zeros when nothing matches). */
export function bm25(lex: Lexicon, request: string, k1 = 1.2, b = 0.75): Float32Array {
  const n = lex.len.length;
  const out = new Float32Array(n);
  const avg = lex.len.reduce((a, x) => a + x, 0) / (n || 1) || 1;
  for (const w of new Set(words(request))) {
    const p = lex.post[w];
    if (!p) continue;
    const df = p.length / 2;
    const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
    for (let i = 0; i < p.length; i += 2) {
      const r = p[i];
      const tf = p[i + 1];
      out[r] += (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * lex.len[r]) / avg));
    }
  }
  let max = 0;
  for (const x of out) max = Math.max(max, x);
  if (max > 0) for (let i = 0; i < n; i++) out[i] /= max;
  return out;
}

/**
 * The text the word score reads: what the benchmark does, from its description, note and paper abstract. Names
 * stay out, so one word in a request can't pull in every benchmark that shares a name.
 */
export function wordText(b: { description?: string; note?: string }, abstract?: string): string {
  return [b.description ?? '', b.note ?? '', abstract ?? ''].filter(Boolean).join(' ');
}

/**
 * The score without the model, for browsers that can't run it: the word score, plus the share of the request's
 * words that appear in the benchmark's name.
 */
export function wordsOnly(lex: Lexicon, names: string[], request: string, nameWeight = NAME_WEIGHT): Float32Array {
  const out = bm25(lex, request);
  const ws = new Set(words(request));
  if (!ws.size) return out;
  names.forEach((n, r) => {
    const nw = new Set(words(n));
    let hit = 0;
    for (const w of ws) if (nw.has(w)) hit++;
    out[r] += (nameWeight * hit) / ws.size;
  });
  return out;
}

/**
 * The key versions fold under: the record's family. A second metric of one benchmark (ProgramBench and ProgramBench
 * almost solved) counts as that benchmark, as the Build an index presets treat it.
 */
const METRIC_SUFFIX = /-(almost|tests-passed)$/;
export function familyKey(id: string, get: (id: string) => { family?: string } | undefined): string {
  const b = get(id);
  if (b?.family) return b.family;
  const base = id.replace(METRIC_SUFFIX, '');
  const parent = base !== id ? get(base) : undefined;
  return parent ? (parent.family ?? base) : id;
}

export interface Ranked {
  id: string;
  /** The combined score that ordered the list. */
  s: number;
  /** The cosine alone. */
  cos: number;
}

/**
 * Orders benchmarks by cosine plus `wordWeight` times the scaled BM25 plus `lift` (the scored-model prior), keeps
 * the best version of each family, and keeps only ids that `allow` accepts. `rows` are the ids in vector order,
 * `words` (optional) is aligned with them.
 */
export function rank(
  rows: string[],
  cos: Float32Array,
  opts: { words?: Float32Array; wordWeight?: number; lift?: (id: string) => number; family?: (id: string) => string; allow?: (id: string) => boolean; k?: number } = {},
): Ranked[] {
  const { words: kw, wordWeight = 0, lift, family = (id) => id, allow = () => true, k = 50 } = opts;
  const best = new Map<string, Ranked>();
  const rowOf = new Map<string, number>();
  for (let r = 0; r < rows.length; r++) {
    const id = rows[r];
    if (!allow(id)) continue;
    rowOf.set(id, r);
    const s = cos[r] + (kw ? wordWeight * kw[r] : 0) + (lift ? lift(id) : 0);
    const f = family(id);
    const cur = best.get(f);
    if (!cur || s > cur.s) best.set(f, { id, s, cos: cos[r] });
  }
  // a second metric of one benchmark ranks for it, but the list shows the benchmark's main metric when the pool has it
  for (const x of best.values()) {
    const main = x.id.replace(METRIC_SUFFIX, '');
    if (main !== x.id && rowOf.has(main)) Object.assign(x, { id: main, cos: cos[rowOf.get(main)!] });
  }
  return [...best.values()].sort((a, b) => b.s - a.s).slice(0, k);
}

/** The first word of a name, lowercased: "FACTS Search" and "FACTS Grounding" share "facts". */
export const nameStem = (name: string) => name.toLowerCase().split(/[^a-z0-9]+/).find(Boolean) ?? '';

/**
 * Keeps at most `cap` benchmarks whose names start with the same word, so one suite (FACTS Search, FACTS
 * Parametric, FACTS Multimodal...) can't fill the list. Order is kept.
 */
export function capStems(ranked: Ranked[], nameOf: (id: string) => string, cap = STEM_CAP): Ranked[] {
  const seen = new Map<string, number>();
  return ranked.filter((r) => {
    const k = nameStem(nameOf(r.id));
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return n < cap;
  });
}
