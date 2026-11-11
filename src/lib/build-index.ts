// The index builder's math and markup, shared by the server render and the page script. It has no data imports,
// so the browser can run it on the payload from /build/matrix.json (built in build-data.ts).
//
// An index here is a weighted average. Each chosen benchmark's scores go on a 0 to 100 scale first: percentages
// stay as they are, other units (Elo, ratings, raw scores) are rescaled from the lowest to the highest model on
// that benchmark, and a benchmark where lower is better is flipped. A model needs scores on at least `need` of the
// chosen benchmarks. A test it lacks gets a predicted score, so skipping a hard test doesn't lift a model: on the
// logit scale, each score is fit as the model's ability minus the test's difficulty (see `fitAbility`).

export type Source = 'ind' | 'lab' | 'all';

export interface Preset {
  id: string;
  name: string;
  /** One sentence on how the preset was picked. */
  how: string;
  b: string[];
}

/** The payload. Arrays, not objects, keep it small. */
export interface Payload {
  v: number;
  asOf: string;
  minModels: number;
  /** lab id: [name, mark kind ('c' color image, 'm' mono mask, '' initial), color token] */
  labs: Record<string, [string, string, string]>;
  /** [id, name, lab, released, has a model page (1 or 0)] */
  models: [string, string, string, string, number][];
  /** [id, name, area, unit, better (1 higher, -1 lower)] */
  benches: [string, string, string, string, number][];
  /** Per benchmark, flat pairs of model index and score: independent runs (leaderboards and Epoch AI). */
  ind: number[][];
  /** The same for scores labs report about their own models. */
  lab: number[][];
  presets: Preset[];
}

export interface Pick {
  id: string;
  w: number;
}
export interface State {
  b: Pick[];
  src: Source;
  /** A model needs scores on at least this many of the chosen tests, or on every one. */
  need: number | 'all';
}

export interface Row {
  m: number;
  value: number;
  has: number;
  rank: number;
  /** Best and worst rank under nearby weightings, and the share of them where the model came first. */
  lo: number;
  hi: number;
  first: number;
  /** Per chosen benchmark, the 0 to 100 score that went in (or null). */
  parts: (number | null)[];
  /** Per chosen benchmark, the predicted score used where `parts` is null (null where the model has a score). */
  est: (number | null)[];
}

export interface Result {
  rows: Row[];
  /** The chosen tests that have scores from this source, with their weights as shares. */
  used: { id: string; bi: number; share: number; n: number }[];
  /** Chosen tests with no score from this source. */
  empty: string[];
  need: number;
  draws: number;
}

export const DRAWS = 400;

export class Matrix {
  p: Payload;
  benchIndex = new Map<string, number>();
  private cols = new Map<string, Map<number, number>>();
  private norms = new Map<string, Map<number, number>>();
  constructor(p: Payload) {
    this.p = p;
    p.benches.forEach((b, i) => this.benchIndex.set(b[0], i));
  }
  private raw(list: number[] | undefined): Map<number, number> {
    const m = new Map<number, number>();
    if (!list) return m;
    for (let i = 0; i < list.length; i += 2) m.set(list[i], list[i + 1]);
    return m;
  }
  /** Scores on one benchmark from one source. With both sources, an independent run wins over the lab's number. */
  column(bi: number, src: Source): Map<number, number> {
    const key = `${bi}:${src}`;
    let c = this.cols.get(key);
    if (c) return c;
    if (src === 'ind') c = this.raw(this.p.ind[bi]);
    else if (src === 'lab') c = this.raw(this.p.lab[bi]);
    else {
      c = this.raw(this.p.lab[bi]);
      for (const [m, v] of this.raw(this.p.ind[bi])) c.set(m, v);
    }
    this.cols.set(key, c);
    return c;
  }
  /** The same scores on a 0 to 100 scale, higher always better. */
  normalized(bi: number, src: Source): Map<number, number> {
    const key = `${bi}:${src}`;
    let n = this.norms.get(key);
    if (n) return n;
    const [, , , unit, better] = this.p.benches[bi];
    const col = this.column(bi, src);
    n = new Map();
    if (unit === '%') {
      for (const [m, v] of col) {
        const x = Math.min(100, Math.max(0, v));
        n.set(m, better < 0 ? 100 - x : x);
      }
    } else {
      let lo = Infinity;
      let hi = -Infinity;
      for (const v of col.values()) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      for (const [m, v] of col) {
        const x = hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50;
        n.set(m, better < 0 ? 100 - x : x);
      }
    }
    this.norms.set(key, n);
    return n;
  }
}

/** A small seeded generator (mulberry32), so a link always shows the same rank ranges. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function compute(mx: Matrix, st: State): Result {
  const picks = st.b.filter((p) => mx.benchIndex.has(p.id) && p.w > 0);
  const used: Result['used'] = [];
  const empty: string[] = [];
  for (const p of picks) {
    const bi = mx.benchIndex.get(p.id)!;
    const n = mx.column(bi, st.src).size;
    if (n) used.push({ id: p.id, bi, share: p.w, n });
    else empty.push(p.id);
  }
  const total = used.reduce((s, u) => s + u.share, 0) || 1;
  for (const u of used) u.share /= total;
  const k = used.length;
  const need = st.need === 'all' ? k : Math.max(1, Math.min(st.need, k));
  if (!k) return { rows: [], used, empty, need, draws: 0 };

  const cols = used.map((u) => mx.normalized(u.bi, st.src));
  const models = new Set<number>();
  for (const c of cols) for (const m of c.keys()) models.add(m);
  // every model with a score helps place the tests' difficulties, and only models with enough tests are ranked
  const all = [...models].map((m) => cols.map((c) => c.get(m) ?? null));
  const base = used.map((u) => u.share);
  const fit = fitAbility(all, base);
  // a predicted score stays within the real scores on that test, so a near-solved test can't predict past its best
  const floor = cols.map((c) => Math.min(...c.values()));
  const ceil = cols.map((c) => Math.max(...c.values()));
  const guess = (th: number, j: number) => Math.min(ceil[j], Math.max(floor[j], fromLogit(th - fit.d[j])));
  const ids = [...models];
  const elig: { m: number; parts: (number | null)[]; z: (number | null)[]; has: number }[] = [];
  ids.forEach((m, i) => {
    const has = all[i].filter((x) => x !== null).length;
    if (has >= need) elig.push({ m, parts: all[i], z: fit.z[i], has });
  });
  // the index: the weighted average of the model's scores, with a predicted score for each test it lacks
  const score = (e: (typeof elig)[number], w: number[]) => {
    const th = ability(e.z, w, fit.d);
    let s = 0;
    let ws = 0;
    for (let j = 0; j < w.length; j++) {
      s += w[j] * (e.parts[j] ?? guess(th, j));
      ws += w[j];
    }
    return ws ? s / ws : 0;
  };
  const name = (m: number) => mx.p.models[m][1];
  const values = elig.map((e) => score(e, base));
  const order = elig.map((_, i) => i).sort((a, b) => values[b] - values[a] || elig[b].has - elig[a].has || name(elig[a].m).localeCompare(name(elig[b].m)));
  const rank = new Array<number>(elig.length);
  order.forEach((i, r) => (rank[i] = r + 1));

  // rank every model again under nearby weightings: each weight scaled by a random factor from 0.5 to 1.5
  const lo = rank.slice();
  const hi = rank.slice();
  const first = new Array<number>(elig.length).fill(0);
  const draws = elig.length > 1 ? DRAWS : 0;
  const rand = rng(hash(JSON.stringify([st.src, need, used.map((u) => [u.id, Math.round(u.share * 1000)])])));
  const vals = new Float64Array(elig.length);
  const idx = elig.map((_, i) => i);
  for (let d = 0; d < draws; d++) {
    const w = base.map((x) => x * (0.5 + rand()));
    for (let i = 0; i < elig.length; i++) vals[i] = score(elig[i], w);
    idx.sort((a, b) => vals[b] - vals[a] || elig[b].has - elig[a].has);
    for (let r = 0; r < idx.length; r++) {
      const i = idx[r];
      if (r + 1 < lo[i]) lo[i] = r + 1;
      if (r + 1 > hi[i]) hi[i] = r + 1;
    }
    first[idx[0]]++;
  }
  const rows: Row[] = order.map((i) => ({
    m: elig[i].m,
    value: values[i],
    has: elig[i].has,
    rank: rank[i],
    lo: lo[i],
    hi: hi[i],
    first: draws ? first[i] / draws : 1,
    parts: elig[i].parts,
    est: elig[i].parts.map((x, j) => (x === null ? guess(ability(elig[i].z, base, fit.d), j) : null)),
  }));
  return { rows, used, empty, need, draws };
}

// ---- predicted scores -----------------------------------------------------------------------------
// A score of x on the 0 to 100 scale becomes log(x / (100 - x)), clipped at 1 and 99 so a perfect or zero score
// stays finite. On that scale each score is fit as the model's ability minus the test's difficulty, by weighted
// least squares. A test's difficulty comes from every model that took it, so a model's predicted score on a test
// it lacks reflects how hard that test was for the models that took it. Difficulties average zero.

const toLogit = (x: number) => {
  const q = Math.min(0.99, Math.max(0.01, x / 100));
  return Math.log(q / (1 - q));
};
const fromLogit = (z: number) => 100 / (1 + Math.exp(-z));

/** A model's ability: the weighted mean of its logit scores, each lifted by its test's difficulty. */
function ability(z: (number | null)[], w: number[], d: Float64Array): number {
  let s = 0;
  let ws = 0;
  for (let j = 0; j < z.length; j++) {
    const v = z[j];
    if (v === null) continue;
    s += w[j] * (v + d[j]);
    ws += w[j];
  }
  return ws ? s / ws : 0;
}

/** Fits test difficulties by alternating between abilities and difficulties until they settle. */
export function fitAbility(parts: (number | null)[][], w: number[], iters = 200): { d: Float64Array; z: (number | null)[][] } {
  const k = w.length;
  const z = parts.map((ps) => ps.map((x) => (x === null ? null : toLogit(x))));
  const d = new Float64Array(k);
  const th = new Float64Array(z.length);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < z.length; i++) th[i] = ability(z[i], w, d);
    let move = 0;
    let mean = 0;
    const next = new Float64Array(k);
    for (let j = 0; j < k; j++) {
      let s = 0;
      let c = 0;
      for (let i = 0; i < z.length; i++) {
        const v = z[i][j];
        if (v === null) continue;
        s += th[i] - v;
        c++;
      }
      next[j] = c ? s / c : 0;
      mean += next[j];
    }
    mean /= k || 1;
    for (let j = 0; j < k; j++) {
      move = Math.max(move, Math.abs(next[j] - mean - d[j]));
      d[j] = next[j] - mean;
    }
    if (move < 1e-6) break;
  }
  return { d, z };
}

// ---- the URL --------------------------------------------------------------------------------------
// ?t=terminal-bench-2-0:30,swe-bench-pro:20&src=ind&need=3 (or need=all). Ids are lowercase, digits and hyphens.

export function readState(search: string, fallback: State): State {
  const q = new URLSearchParams(search);
  const t = q.get('t');
  if (!t) return fallback;
  const b = t
    .split(',')
    .map((x) => {
      const [id, w] = x.split(':');
      return { id: (id ?? '').trim(), w: Math.max(0, Math.min(100, Math.round(Number(w ?? 50)))) };
    })
    .filter((p) => /^[a-z0-9][a-z0-9-]*$/.test(p.id) && Number.isFinite(p.w));
  const src = q.get('src');
  const need = q.get('need');
  return {
    b,
    src: src === 'ind' || src === 'lab' || src === 'all' ? src : fallback.src,
    need: need === 'all' ? 'all' : need && Number(need) >= 1 ? Math.round(Number(need)) : fallback.need,
  };
}

export function writeState(st: State): string {
  const t = st.b.map((p) => `${p.id}:${p.w}`).join(',');
  return `?t=${t}&src=${st.src}&need=${st.need}`;
}

/** The default minimum: half the chosen tests, rounded up. */
export const defaultNeed = (k: number) => Math.max(1, Math.ceil(k / 2));

// ---- markup ---------------------------------------------------------------------------------------
// Plain strings, so the server render and the page script draw the same thing. Every name is escaped.

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const fmt = (v: number) => v.toFixed(1);
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function mark(p: Payload, lab: string, size = 18): string {
  const l = p.labs[lab];
  const name = esc(l?.[0] ?? lab ?? '');
  if (l?.[1] === 'c') return `<img class="bm-mark" src="/labs/${esc(lab)}-color.svg" width="${size}" height="${size}" alt="" title="${name}" decoding="async">`;
  if (l?.[1] === 'm') return `<span class="bm-mark bm-mask" style="--s:${size}px;--m:url(/labs/${esc(lab)}.svg)" title="${name}" aria-hidden="true"></span>`;
  return `<span class="bm-mark bm-initial" style="--s:${size}px" title="${name}" aria-hidden="true">${esc((l?.[0] ?? '?').slice(0, 1))}</span>`;
}

const labColor = (p: Payload, lab: string) => p.labs[lab]?.[2] ?? 'var(--lab-other)';

function modelName(p: Payload, m: number): string {
  const [id, name, , , page] = p.models[m];
  return page ? `<a href="/models/${esc(id)}/">${esc(name)}</a>` : esc(name);
}

function partsLine(p: Payload, r: Row, res: Result): string {
  return res.used
    .map((u, j) => `${p.benches[u.bi][1]} ${r.parts[j] === null ? `${fmt(r.est[j]!)} predicted` : fmt(r.parts[j]!)}`)
    .join(', ');
}

/** The headline: a finding computed from the result. */
export function headline(p: Payload, res: Result): string {
  const top = res.rows[0];
  if (!top) return res.used.length ? 'No model has enough of these tests' : 'Pick a few benchmarks to build an index';
  const name = p.models[top.m][1];
  if (res.rows.length === 1) return `${name} is the only model with enough of these tests`;
  const tail =
    top.first >= 0.995 ? 'and stays first under every nearby weighting' : `and stays first under ${pct(top.first)} of nearby weightings`;
  return `${name} leads this mix with ${fmt(top.value)}, ${tail}`;
}

export function sub(p: Payload, res: Result, src: Source): string {
  if (!res.used.length) return '';
  const from = src === 'ind' ? 'independent runs' : src === 'lab' ? 'the labs’ own numbers' : 'independent runs, with the labs’ own numbers filling gaps';
  const runner = res.rows[1];
  const gap = runner ? ` ${p.models[runner.m][1]} is second at ${fmt(runner.value)}.` : '';
  return `${res.rows.length} ${res.rows.length === 1 ? 'model has' : 'models have'} scores on at least ${res.need} of the ${res.used.length} tests, from ${from}.${gap}`;
}

/** Desktop: columns in lab colors from one baseline, the value on the cap, mark and name under it. */
export function columns(p: Payload, res: Result, limit = 40): string {
  const rows = res.rows.slice(0, limit);
  const H = 220;
  return `<ol class="bm-cols" style="--h:${H}px">${rows
    .map((r) => {
      const [, name, lab] = p.models[r.m];
      const h = Math.max(2, (r.value / 100) * H);
      return `<li class="bm-col"><span class="bm-hit" data-tv="${fmt(r.value)}" data-tn="${r.rank}. ${esc(name)}" data-ts="${esc(`${r.has} of ${res.used.length} tests. ${partsLine(p, r, res)}`)}"><span class="bm-plot"><span class="bm-v num">${fmt(r.value)}</span><span class="bm-bar" style="height:${h.toFixed(1)}px;background:${labColor(p, lab)}"></span></span>${mark(p, lab)}<span class="bm-cn">${esc(name)}</span></span></li>`;
    })
    .join('')}</ol>`;
}

/** Phones: horizontal bars, 15 rows and a button for the rest. */
export function bars(p: Payload, res: Result, limit = 15): string {
  return `<ol class="bm-bars">${res.rows
    .map((r, i) => {
      const [, name, lab] = p.models[r.m];
      return `<li${i >= limit ? ' class="later" hidden' : ''}><span class="rk num">${r.rank}</span><span class="who">${mark(p, lab, 16)}<span>${esc(name)}</span></span><span class="track" data-tv="${fmt(r.value)}" data-tn="${esc(name)}" data-ts="${esc(`${r.has} of ${res.used.length} tests`)}"><span class="fill" style="width:${Math.max(0.6, r.value).toFixed(1)}%;background:${labColor(p, lab)}"></span><span class="val num">${fmt(r.value)}</span></span></li>`;
    })
    .join('')}</ol>${res.rows.length > limit + 2 ? `<button type="button" class="bm-more" data-more>Show all ${res.rows.length} models</button>` : ''}`;
}

/** The table: rank, model, index, coverage, and the rank range under nearby weightings. */
export function table(p: Payload, res: Result, limit = 50): string {
  const n = res.rows.length;
  // the range strip runs from rank 1 to the worst rank any shown model reached, so it fits the shown rows
  const span = Math.max(2, ...res.rows.slice(0, limit).map((r) => r.hi));
  const x = (rank: number) => ((rank - 1) / (span - 1)) * 100;
  const body = res.rows
    .map((r, i) => {
      const lab = p.models[r.m][2];
      const one = r.lo === r.hi;
      const strip = `<span class="bm-range" role="img" aria-label="Rank ${r.lo} at best, ${r.hi} at worst"><span class="bm-track"></span>${one ? '' : `<span class="bm-seg" style="left:${x(r.lo).toFixed(1)}%;width:${(x(r.hi) - x(r.lo)).toFixed(1)}%"></span>`}<span class="bm-dot" style="left:${x(r.lo).toFixed(1)}%"></span>${one ? '' : `<span class="bm-dot" style="left:${x(r.hi).toFixed(1)}%"></span>`}</span>`;
      return `<tr${i >= limit ? ' class="later" hidden' : ''}><td class="r rank num">${r.rank}</td><td class="who">${mark(p, lab)}<span class="nm">${modelName(p, r.m)}</span></td><td class="r num"><b>${fmt(r.value)}</b></td><td class="r num has">${r.has} of ${res.used.length}</td><td class="r num lo">${r.lo}</td><td class="rng">${strip}</td><td class="num hi">${r.hi}</td><td class="r num first">${r.first >= 0.005 ? pct(r.first) : r.first > 0 ? '<1%' : ''}</td></tr>`;
    })
    .join('');
  return `<table class="t bm-t"><thead><tr><th class="r">Rank</th><th>Model</th><th class="r">Index</th><th class="r has">Tests</th><th class="r lo">Best</th><th class="rng">Rank range</th><th class="hi">Worst</th><th class="r first">First</th></tr></thead><tbody>${body}</tbody></table>${n > limit ? `<button type="button" class="bm-more" data-more-t>Show all ${n} models</button>` : ''}`;
}

/** The weights as one stacked bar, each test in its area's color, with a 2px gap between segments. */
export function weightBar(p: Payload, res: Result): string {
  return `<div class="bm-wbar" role="img" aria-label="${esc(res.used.map((u) => `${p.benches[u.bi][1]} ${pct(u.share)}`).join(', '))}">${res.used
    .map((u) => {
      const [, name, area] = p.benches[u.bi];
      return `<span style="flex:${u.share.toFixed(4)} 1 0;background:var(--area-${esc(area)})" data-tv="${pct(u.share)}" data-tn="${esc(name)}"></span>`;
    })
    .join('')}</div>`;
}

export const AREA_NAMES: Record<string, string> = {
  knowledge: 'Knowledge and language',
  reasoning: 'Math and science',
  code: 'Coding',
  agents: 'Agents and tools',
  work: 'Professional work',
  multimodal: 'Vision, audio and robotics',
  safety: 'Safety and security',
  other: 'Other',
};

/** The chosen tests, each with its area, a weight slider and its share of the index. */
export function chosen(p: Payload, mx: Matrix, st: State, res: Result): string {
  const shares = new Map(res.used.map((u) => [u.id, u.share]));
  const total = st.b.reduce((s, x) => s + x.w, 0);
  return st.b
    .map((pk, i) => {
      const bi = mx.benchIndex.get(pk.id);
      if (bi === undefined) return '';
      const [id, name, area] = p.benches[bi];
      const n = mx.column(bi, st.src).size;
      const share = shares.get(id);
      const note = n ? `${n} models` : 'no scores from this source';
      return `<li class="bm-pick" data-id="${esc(id)}"><span class="bm-adot" style="background:var(--area-${esc(area)})" title="${esc(AREA_NAMES[area] ?? area)}"></span><span class="bm-pname"><a href="/benchmarks/${esc(id)}/">${esc(name)}</a><small class="${n ? '' : 'none'}">${note}</small></span><input type="range" min="0" max="100" step="1" value="${pk.w}" data-w="${i}" aria-label="Weight of ${esc(name)}"><output class="num">${share !== undefined ? pct(share) : total && n ? '0%' : ''}</output><button type="button" class="bm-x" data-x="${i}" aria-label="Remove ${esc(name)}">×</button></li>`;
    })
    .join('');
}
