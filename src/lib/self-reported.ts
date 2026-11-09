// The Self-Reported Index: one capability score per model, fit only to the numbers labs publish about their own
// models in launch posts, system cards, model cards and technical reports. It uses the item response model in
// irt.ts, the kind Epoch AI uses for its Capabilities Index (ECI), and it is put on the ECI's scale so the two
// read side by side. Labs choose which benchmarks to report and how to run them, so this index shows what labs
// claim. It is not an independent measurement. The methodology page (pages/methodology.astro) explains it.

import { cards, systemCards, benchById, eciByModel } from './data.ts';
import { areaOf } from './taxonomy.ts';
import { fitIrt, thetaIntervals, predict, pearson, spearman, type Obs } from './irt.ts';

/** The thresholds a score, a benchmark and a model must pass. The methodology page prints these. */
export const SR_RULES = {
  /** A benchmark joins the fit when at least this many models report it. */
  minModels: 8,
  /** A model gets an index score when it reports at least this many of those benchmarks... */
  minBenchmarks: 5,
  /** ...and at least this many of them test text, code, agents or professional work, not only vision. */
  minText: 3,
};

/** Areas whose benchmarks measure risk or a different kind of system, which a capability index leaves out. */
const LEFT_OUT_CATEGORIES = new Set(['safety-alignment', 'cyber', 'bio-chem', 'robotics-embodied', 'world-models', 'other']);
/** System card sections that hold capability results. Safety, alignment and similar sections are left out. */
const SECTIONS = new Set(['capabilities', 'hallucination', 'ai-rnd', 'health']);
const PCT = /^\s*(%|f1|anls ?%|anls x100|% win|accuracy|pass@1|percent|)\s*$/i;
const TEXT_AREAS = new Set(['knowledge', 'reasoning', 'code', 'agents', 'work']);

export interface SelfReported {
  value: number;
  low: number;
  high: number;
  /** How many benchmarks the score rests on. */
  n: number;
  rank: number;
  /** The benchmarks it rests on, with the best score the lab reported on each. */
  scores: { benchmark: string; value: number }[];
}

// ---- the scores ---------------------------------------------------------------------------------
// The best score a lab reported for each model and benchmark, across its documents and settings. The site ranks
// every model at its best setting, and this does the same.
const best = new Map<string, { model: string; bench: string; value: number }>();
let docsUsed = 0;
for (const doc of [...cards, ...systemCards]) {
  let used = false;
  for (const r of doc.results) {
    const b = benchById.get(r.benchmark);
    if (!b || r.score === null || !PCT.test(r.unit ?? '')) continue;
    if ((b.unit ?? '%') !== '%' || b.better === 'lower' || LEFT_OUT_CATEGORIES.has(b.category ?? 'other')) continue;
    if (r.section && !SECTIONS.has(r.section)) continue;
    if (r.score < 0 || r.score > 100) continue;
    const k = `${doc.model}|${r.benchmark}`;
    const cur = best.get(k);
    if (!cur || r.score > cur.value) best.set(k, { model: doc.model, bench: r.benchmark, value: r.score });
    used = true;
  }
  if (used) docsUsed++;
}

// keep benchmarks enough models report, and models that report enough of them, until both rules hold
let kept = [...best.values()];
for (let pass = 0; pass < 20; pass++) {
  const perBench = new Map<string, number>();
  for (const s of kept) perBench.set(s.bench, (perBench.get(s.bench) ?? 0) + 1);
  const next1 = kept.filter((s) => perBench.get(s.bench)! >= SR_RULES.minModels);
  const perModel = new Map<string, { all: number; text: number }>();
  for (const s of next1) {
    const c = perModel.get(s.model) ?? { all: 0, text: 0 };
    c.all++;
    if (TEXT_AREAS.has(areaOf(benchById.get(s.bench)!.category))) c.text++;
    perModel.set(s.model, c);
  }
  const next = next1.filter((s) => perModel.get(s.model)!.all >= SR_RULES.minBenchmarks && perModel.get(s.model)!.text >= SR_RULES.minText);
  const done = next.length === kept.length;
  kept = next;
  if (done) break;
}

/** Scores count from chance, as Epoch AI's index does: 25% on a four-choice test is zero. */
const chance = (bench: string) => benchById.get(bench)?.epoch?.random ?? 0;
const toObs = (s: { model: string; bench: string; value: number }): Obs => ({
  model: s.model,
  bench: s.bench,
  y: Math.max(0, (s.value - chance(s.bench)) / (100 - chance(s.bench))),
});
const obs = kept.map(toObs);

// ---- the fit ------------------------------------------------------------------------------------
const fit = fitIrt(obs);
const ci = thetaIntervals(fit, obs);

// The ECI's scale: match the mean and spread of the models that have both scores.
const overlap = fit.models.map((m, i) => ({ m, t: fit.theta[i], e: eciByModel.get(m)?.eci })).filter((x): x is { m: string; t: number; e: number } => x.e !== undefined);
const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
const sd = (xs: number[]) => Math.sqrt(mean(xs.map((v) => (v - mean(xs)) ** 2)));
const scale = sd(overlap.map((x) => x.e)) / sd(overlap.map((x) => x.t));
const shift = mean(overlap.map((x) => x.e)) - scale * mean(overlap.map((x) => x.t));
const toEci = (t: number) => shift + scale * t;

const byModelScores = new Map<string, { benchmark: string; value: number }[]>();
for (const s of kept) byModelScores.set(s.model, [...(byModelScores.get(s.model) ?? []), { benchmark: s.bench, value: s.value }]);

/** Model ids, highest Self-Reported Index first. */
export const selfReportedOrder = fit.models.map((m, i) => ({ m, v: fit.theta[i] })).sort((a, b) => b.v - a.v).map((x) => x.m);
const rankOf = new Map(selfReportedOrder.map((m, i) => [m, i + 1]));

export const selfReported = new Map<string, SelfReported>(
  fit.models.map((m, i) => {
    const iv = ci.get(m)!;
    const scores = (byModelScores.get(m) ?? []).sort((a, b) => b.value - a.value);
    return [m, { value: toEci(fit.theta[i]), low: toEci(iv.low), high: toEci(iv.high), n: scores.length, rank: rankOf.get(m)!, scores }];
  }),
);

/** Every index value, low to high, for the strip on a model card. */
export const selfReportedValues = [...selfReported.values()].map((s) => s.value).sort((a, b) => a - b);

/** Facts about the fit, for the methodology page. */
export const SR_FIT = {
  models: fit.models.length,
  benchmarks: fit.benches.length,
  scores: obs.length,
  /** Lab documents that gave at least one capability score in percent. */
  docs: docsUsed,
  /** Models with both an ECI score and a Self-Reported Index. */
  overlap: overlap.length,
  pearson: pearson(overlap.map((x) => x.t), overlap.map((x) => x.e)),
  spearman: spearman(overlap.map((x) => x.t), overlap.map((x) => x.e)),
  /** Typical distance from ECI, in index points, after the scales are matched. */
  medianGap: (() => {
    const g = overlap.map((x) => Math.abs(toEci(x.t) - x.e)).sort((a, b) => a - b);
    return g[Math.floor(g.length / 2)];
  })(),
  /** Root mean square error of the fitted scores, in percentage points of the room above chance. */
  rmse: fit.rmse * 100,
};

/** Models with both scores, for the comparison chart: the Self-Reported Index and the ECI. */
export const srVsEci = overlap.map((x) => ({ model: x.m, sr: toEci(x.t), eci: x.e }));

/** The benchmarks in the fit, most reported first, with their difficulty on the index scale. */
export const srBenchmarks = (() => {
  const count = new Map<string, number>();
  for (const s of kept) count.set(s.bench, (count.get(s.bench) ?? 0) + 1);
  return fit.benches
    .map((b, j) => ({ id: b, models: count.get(b) ?? 0, difficulty: toEci(fit.difficulty[j]), slope: fit.slope[j] }))
    .sort((a, b) => b.models - a.models || a.id.localeCompare(b.id));
})();

let heldOutCache: { n: number; rmse: number; mae: number; baseline: number } | undefined;
/**
 * A five-fold check: fit on four fifths of the scores, predict the other fifth, and compare with guessing each
 * benchmark's average. Computed only when a page asks for it, since it fits the model five more times.
 */
export function srHeldOut() {
  if (heldOutCache) return heldOutCache;
  const err: number[] = [];
  const base: number[] = [];
  for (let fold = 0; fold < 5; fold++) {
    const train = kept.filter((_, k) => k % 5 !== fold);
    const test = kept.filter((_, k) => k % 5 === fold);
    const f = fitIrt(train.map(toObs), { iters: 2500 });
    const avg = new Map<string, number[]>();
    for (const s of train) avg.set(s.bench, [...(avg.get(s.bench) ?? []), s.value]);
    for (const s of test) {
      const q = predict(f, s.model, s.bench);
      if (q === undefined || !avg.has(s.bench)) continue;
      const c = chance(s.bench);
      err.push(c + q * (100 - c) - s.value);
      base.push(mean(avg.get(s.bench)!) - s.value);
    }
  }
  const rms = (xs: number[]) => Math.sqrt(mean(xs.map((v) => v * v)));
  heldOutCache = { n: err.length, rmse: rms(err), mae: mean(err.map(Math.abs)), baseline: rms(base) };
  return heldOutCache;
}
