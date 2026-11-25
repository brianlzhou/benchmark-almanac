// Pre-training Index, Elie Bakouch's language modeling index for open base and post-trained models.
// The headline is bits per byte, lower is better: a weighted mean over 277 curated sources and Uncheatable Eval, as the
// page computes it by default. The page ships its data as JSON and computes every number in the browser, so this
// importer repeats the page's default computation (its compute(), level(), coefs() and computeStats()):
//   - curated cells only, with the memorized-document cut the page applies by default (drop "2": old documents some
//     model knows unusually well, r < -2, are left out for every model)
//   - a kind of text is the mean of its sources, each source pooled by bytes; the index weights the kinds of text as
//     the page does (Uncheatable Eval half of it, 10 per domain, the curated kinds the other half)
//   - the 95% interval and the win rate come from the page's covariance and win tables for the same view
// On 2026-11-24 this reproduced all 27 models' index values and win rates as the page shows them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://eliebak.com/pretraining-index';

const PILLARS = [
  { id: 'code', groups: ['code', 'ml-systems-code', 'formal-math', 'creative'] },
  { id: 'mathScience', groups: ['math-physics', 'worked-solutions', 'papers', 'textbooks', 'science'] },
  { id: 'systems', groups: ['compute-writing', 'eng-writing', 'specs-design', 'tech-discussion', 'postmortems'] },
  { id: 'ideas', groups: ['ml-writing', 'frontier-writing', 'essays', 'podcast'] },
  { id: 'uncheatable', groups: ['unch-code', 'unch-papers', 'unch-news', 'unch-fiction', 'unch-reference'] },
];
const CURATED: Record<string, number> = {
  code: 25, 'ml-systems-code': 15, 'formal-math': 5, creative: 5,
  'math-physics': 6, 'worked-solutions': 4, papers: 4, textbooks: 3, science: 3,
  'compute-writing': 6, 'eng-writing': 5, 'specs-design': 4, 'tech-discussion': 3, postmortems: 2,
  'ml-writing': 4, 'frontier-writing': 2, essays: 2, podcast: 2,
};
const WEIGHT: Record<string, number> = {
  'unch-code': 10, 'unch-papers': 10, 'unch-news': 10, 'unch-fiction': 10, 'unch-reference': 10,
  ...Object.fromEntries(Object.entries(CURATED).map(([g, w]) => [g, w / 2])),
};
const ROUTE: Record<string, string> = {
  'frontier-writing/mitchellh': 'eng-writing', 'frontier-writing/antirez': 'eng-writing',
  'frontier-writing/dwarkesh-podcast': 'podcast', 'frontier-writing/3b1b': 'math-physics',
};
const DROP = '2';

interface Data {
  meta: { cutoff: string; t0: number; buckets: { l: string; ym: string | null }[] };
  models: { id: string; repo: string; label: string; kind: string; org: string; total?: number; active?: number | null; released?: string }[];
  cells: { s: string; v: number; t: number; b: number; d: number }[];
  bpb: (number | null)[][];
  sources: { key: string; group: string; status: string }[];
  drop: Record<string, { ci: number[]; b: number[]; bpb: (number | null)[][] }>;
  stats: {
    cov: Record<string, Record<string, number[]>>; win: Record<string, Record<string, number[]>>;
    dcov: Record<string, Record<string, Record<string, number[]>>>; dwin: Record<string, Record<string, Record<string, number[]>>>;
  };
}

function compute(D: Data) {
  const groups = PILLARS.flatMap((p) => p.groups);
  const gidx = Object.fromEntries(groups.map((g, i) => [g, i]));
  const sourceGroup = new Map(D.sources.filter((s) => s.status === 'in').map((s) => [s.key, s.group]));
  const groupOf = (k: string) => sourceGroup.get(k) || ROUTE[k] || k.split('/')[0];
  const C = D.cells, T0 = D.meta.t0;
  const keys = [...new Set(C.map((c) => c.s))].sort();
  const si = new Map(keys.map((k, i) => [k, i]));
  const sgi = keys.map((k) => gidx[groupOf(k)] ?? -1);
  const drop = D.drop?.[DROP];
  if (!drop || !D.stats?.dcov?.[DROP] || !D.stats?.dwin?.[DROP]) throw new Error('Pre-training Index: default memorization cut missing');
  const bytes = C.map((c) => c.b), bpb = D.bpb.map((a) => a.slice());
  drop.ci.forEach((ci, k) => { bytes[ci] = drop.b[k]; bpb.forEach((a, m) => (a[ci] = drop.bpb[m][k])); });
  const months = D.meta.buckets.slice(T0).map((b) => b.ym);
  const cut = months.indexOf(D.meta.cutoff.slice(0, 7));
  if (cut < 0) throw new Error(`Pre-training Index: cutoff ${D.meta.cutoff} is not a month on the page`);

  const level = (acc: number[]) => {
    const n = new Array(groups.length).fill(0), d = new Array(groups.length).fill(0);
    keys.forEach((_, s) => { const den = acc[2 * s + 1], g = sgi[s]; if (den > 0 && g >= 0) { n[g] += acc[2 * s] / den; d[g] += 1; } });
    const parts: Record<string, number> = {};
    let num = 0, den = 0;
    for (const P of PILLARS) {
      let sum = 0, w = 0;
      for (const g of P.groups) { const i = gidx[g]; if (d[i] > 0) { sum += WEIGHT[g] * (n[i] / d[i]); w += WEIGHT[g]; } }
      if (w) parts[P.id] = sum / w;
      num += sum; den += w;
    }
    return { index: den ? num / den : NaN, parts };
  };
  const scores = D.models.map((_, m) => {
    const pre = new Array(keys.length * 2).fill(0), post = pre.slice(), all = pre.slice();
    C.forEach((c, ci) => {
      if (c.v !== 0) return;
      const s = si.get(c.s)!;
      if (sgi[s] < 0) return;
      const v = bpb[m][ci], b = bytes[ci];
      if (v == null || !(b > 0)) return;
      const x = c.t >= T0 + cut ? post : pre;
      x[2 * s] += v * b; x[2 * s + 1] += b; all[2 * s] += v * b; all[2 * s + 1] += b;
    });
    return { all: level(all), pre: level(pre), post: level(post) };
  });

  // interval and win rate: each source's weight in the index, then the page's covariance and pairwise win tables
  const N = D.models.length, NS = keys.length;
  const sb = new Array(NS).fill(0);
  C.forEach((c, ci) => { if (c.v === 0) sb[si.get(c.s)!] += bytes[ci]; });
  const coef = new Array(NS).fill(0);
  const sel: [number, number[]][] = [];
  let total = 0;
  for (const g of groups) {
    const ss: number[] = [];
    for (let s = 0; s < NS; s++) if (sgi[s] === gidx[g] && sb[s] > 0) ss.push(s);
    if (ss.length) { sel.push([WEIGHT[g], ss]); total += WEIGHT[g]; }
  }
  for (const [w, ss] of sel) for (const s of ss) coef[s] += w / total / ss.length;
  const V = new Float64Array(N * N), W = new Float64Array(N * N);
  const dcov = D.stats.dcov[DROP], dwin = D.stats.dwin[DROP];
  for (let s = 0; s < NS; s++) {
    if (!(coef[s] > 0)) continue;
    const k = keys[s];
    const cv = dcov[k]?.['0'] ?? D.stats.cov[k]?.['0'], wv = dwin[k]?.['0'] ?? D.stats.win[k]?.['0'];
    if (cv) { let p = 0; for (let i = 0; i < N; i++) for (let j = i; j < N; j++, p++) { const x = coef[s] * coef[s] * cv[p]; V[i * N + j] += x; if (i !== j) V[j * N + i] += x; } }
    if (wv) { let p = 0; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++, p++) { const x = (coef[s] * wv[p]) / 1000; W[i * N + j] += x; W[j * N + i] += coef[s] - x; } }
  }
  return scores.map((sc, a) => {
    let w = 0;
    for (let b = 0; b < N; b++) if (b !== a) w += W[a * N + b];
    return { ...sc, ci: 1.96 * Math.sqrt(V[a * N + a]), win: N > 1 ? w / (N - 1) : NaN };
  });
}

const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

const board: Leaderboard = {
  benchmark: 'pretraining-index',
  url: PAGE,
  feed: PAGE,
  terms: "The page publishes its data and results openly. eliebak.com's robots.txt sets no rules for this path. Results are credited to Elie Bakouch's Pre-training Index.",
  aliases: {
    'Reflection Beam 1.0': 'beam-1-0',
    'Ripple 65B': 'ripple-65b-preview',
    'Ripple 65B Base': 'ripple-65b-base-preview',
    'Nemotron 3 Nano Base': 'nemotron-3-nano-30b-a3b-base',
    'Nemotron 3 Super Base': 'nemotron-3-super-120b-a12b-base',
    'Nemotron 3.5 Super VL Base': 'nemotron-3-5-super-120b-a12b-base',
    'DeepSeek V4 Pro Base': 'deepseek-v4-pro-base',
    'ERNIE 5.5 Flash Base': 'ernie-5-5-flash-base',
    'OLMo 3 32B': 'olmo-3-32b',
    'Marin 32B base': 'marin-32b-base',
    'Marin Mochi 535B': 'marin-mochi-535b-a23b',
    'Laguna M.1 base': 'laguna-m-1-base',
    'Step 3.5 Flash Base': 'step-3-5-flash-base',
  },
  parts: {
    code: { name: 'Code', group: 'Collection' },
    mathScience: { name: 'Math & science', group: 'Collection' },
    systems: { name: 'Systems writing', group: 'Collection' },
    ideas: { name: 'Ideas writing', group: 'Collection' },
    uncheatable: { name: 'Uncheatable Eval', group: 'Collection' },
  },
  stats: {
    winRate: { name: 'Win rate', unit: '%', better: 'higher', note: 'Share of documents where the model has fewer bits per byte than another model, averaged over the other models and weighted like the index.' },
    recent: { name: 'Documents published after the cutoff', unit: 'score', better: 'lower', note: "The index over documents published since the page's cutoff month, after every listed model's estimated knowledge cutoff." },
    older: { name: 'Older documents', unit: 'score', better: 'lower', note: 'The index over documents published before the cutoff month, which some models may have trained on.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const m = html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('Pre-training Index: data block missing');
    const D = JSON.parse(m[1]) as Data;
    if (!Array.isArray(D.models) || D.models.length < 10 || D.bpb?.length !== D.models.length) throw new Error('Pre-training Index: model table changed');
    const results = compute(D);
    const rows = D.models.map((model, i) => {
      const r = results[i];
      if (!(r.all.index > 0.1 && r.all.index < 3) || !Number.isFinite(r.ci) || !Number.isFinite(r.win)) throw new Error(`Pre-training Index: bad result for ${model.label}`);
      const metrics: Record<string, number> = { winRate: r4(100 * r.win) };
      for (const [k, v] of Object.entries(r.all.parts)) metrics[k] = r4(v);
      if (Number.isFinite(r.post.index)) metrics.recent = r4(r.post.index);
      if (Number.isFinite(r.pre.index)) metrics.older = r4(r.pre.index);
      // "Step 3.5 Flash Base (midtrain)" and "Marin Mochi 535B (final)" name a checkpoint of a model
      const checkpoint = model.label.match(/^(.*?)\s*\((midtrain|final)\)$/);
      const setting = [model.kind === 'post' ? '' : 'base model', checkpoint ? `${checkpoint[2]} checkpoint` : ''].filter(Boolean).join(', ');
      return {
        model: checkpoint ? checkpoint[1] : model.label,
        setting: setting || undefined,
        score: r4(r.all.index),
        low: r4(r.all.index - r.ci),
        high: r4(r.all.index + r.ci),
        open: true,
        params: model.total ?? undefined,
        link: `https://huggingface.co/${model.repo}`,
        metrics,
      };
    });
    return rows;
  },
};
export default board;
