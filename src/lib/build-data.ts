// The index builder's data: every benchmark with enough scored models, the best score per model from each
// source, and presets computed from the catalog. /build/matrix.json serves it, and the page renders its
// default view from it on the server. The math lives in build-index.ts.

import { benchmarks, models, labs, cards, systemCards, leaderboardScores, epochScores, cardScores, bestPerModel, benchById, AS_OF } from './data.ts';
import { areaOf } from './taxonomy.ts';
import { labColor } from './palette.ts';
import { COLOR_MARKS, MONO_MARKS } from './marks.ts';
import { featuredIds } from './routes.ts';
import type { Benchmark, Score } from './types.ts';
import type { Payload, Preset } from './build-index.ts';

/** A benchmark joins the builder when at least this many models have a score on it from one source. */
export const MIN_MODELS = 8;
/** A model joins when it has scores on at least this many of those benchmarks. */
export const MIN_SCORES = 3;
/** Areas left out of the presets: they measure risk, not capability, or fit nowhere. */
const NOT_CAPABILITY = new Set(['safety', 'other']);

const round = (v: number) => Math.round(v * 10) / 10;

function group(scores: Score[]): Map<string, Score[]> {
  const m = new Map<string, Score[]>();
  for (const s of scores) {
    if (!s.model) continue;
    (m.get(s.benchmark) ?? m.set(s.benchmark, []).get(s.benchmark)!).push(s);
  }
  return m;
}

let cached: Payload | null = null;

export function buildPayload(): Payload {
  if (cached) return cached;
  const indBy = group([...leaderboardScores, ...epochScores]);
  const labBy = group(cardScores);
  const best = (by: Map<string, Score[]>, b: Benchmark) => bestPerModel(by.get(b.id) ?? [], b);

  // benchmarks: enough models from one source, and a unit an index can use (a cost per task is not a skill)
  const picked = benchmarks
    .map((b) => ({ b, ind: best(indBy, b), lab: best(labBy, b) }))
    .filter((x) => (x.b.unit ?? '%') !== 'usd' && (x.ind.length >= MIN_MODELS || x.lab.length >= MIN_MODELS));

  // models: a few scores across those benchmarks
  const count = new Map<string, number>();
  for (const x of picked) {
    const seen = new Set([...x.ind.map((s) => s.model), ...x.lab.map((s) => s.model)]);
    for (const m of seen) count.set(m, (count.get(m) ?? 0) + 1);
  }
  const modelList = models.filter((m) => (count.get(m.id) ?? 0) >= MIN_SCORES).sort((a, b) => a.id.localeCompare(b.id));
  const mi = new Map(modelList.map((m, i) => [m.id, i]));
  const flat = (rows: Score[]) => rows.filter((s) => mi.has(s.model)).flatMap((s) => [mi.get(s.model)!, round(s.value)]);

  const benches = picked
    .map((x) => ({ x, ind: flat(x.ind), lab: flat(x.lab) }))
    .filter((y) => y.ind.length / 2 >= MIN_MODELS || y.lab.length / 2 >= MIN_MODELS)
    .sort((a, b) => a.x.b.name.localeCompare(b.x.b.name));

  const usedLabs = new Set(modelList.map((m) => m.lab).filter((l): l is string => !!l));
  const labMap: Payload['labs'] = {};
  for (const l of labs)
    if (usedLabs.has(l.id)) labMap[l.id] = [l.name, COLOR_MARKS.has(l.id) ? 'c' : MONO_MARKS.has(l.id) ? 'm' : '', labColor(l.id)];

  const p: Payload = {
    v: 1,
    asOf: AS_OF,
    minModels: MIN_MODELS,
    labs: labMap,
    models: modelList.map((m) => [m.id, m.name, m.lab ?? '', m.released ?? '', featuredIds.has(m.id) ? 1 : 0]),
    benches: benches.map(({ x }) => [x.b.id, x.b.name, areaOf(x.b.category), x.b.unit ?? '%', x.b.better === 'lower' ? -1 : 1]),
    ind: benches.map((y) => y.ind),
    lab: benches.map((y) => y.lab),
    presets: [],
  };
  p.presets = presets(p);
  cached = p;
  return p;
}

// ---- presets --------------------------------------------------------------------------------------

const famOf = (id: string) => benchById.get(id)?.family ?? id;

function presets(p: Payload): Preset[] {
  const inBuilder = new Map(p.benches.map((b, i) => [b[0], i]));
  const nInd = (id: string) => (p.ind[inBuilder.get(id)!]?.length ?? 0) / 2;
  const members = new Map<string, string[]>();
  for (const [id] of p.benches) (members.get(famOf(id)) ?? members.set(famOf(id), []).get(famOf(id))!).push(id);

  // which labs reported each family, and how often each version was reported, in this year and in the last 18 months
  const year = AS_OF.slice(0, 4);
  const since = new Date(Date.parse(AS_OF) - 548 * 864e5).toISOString().slice(0, 10);
  const labsYear = new Map<string, Set<string>>();
  const labsRecent = new Map<string, Set<string>>();
  const versionYear = new Map<string, number>();
  const add = (m: Map<string, Set<string>>, k: string, v: string) => (m.get(k) ?? m.set(k, new Set()).get(k)!).add(v);
  for (const d of [...cards, ...systemCards]) {
    if (!d.date || d.date < since) continue;
    for (const r of d.results) {
      const b = benchById.get(r.benchmark);
      if (!b || NOT_CAPABILITY.has(areaOf(b.category))) continue;
      const f = famOf(r.benchmark);
      add(labsRecent, f, d.lab);
      if (d.date.startsWith(year)) {
        add(labsYear, f, d.lab);
        versionYear.set(r.benchmark, (versionYear.get(r.benchmark) ?? 0) + 1);
      }
    }
  }

  // models released in the last six months with a score on this version, from either source. Counting over a
  // longer window picks old versions (Terminal-Bench 2.0) that the newest models no longer report.
  const fresh = new Date(Date.parse(AS_OF) - 183 * 864e5).toISOString().slice(0, 10);
  const recent = (id: string) => {
    const bi = inBuilder.get(id)!;
    const seen = new Set<number>();
    for (const list of [p.ind[bi] ?? [], p.lab[bi] ?? []])
      for (let i = 0; i < list.length; i += 2) if ((p.models[list[i]][3] ?? '') >= fresh) seen.add(list[i]);
    return seen.size;
  };
  const top = (list: number[]) => {
    let hi = -Infinity;
    for (let i = 1; i < list.length; i += 2) hi = Math.max(hi, list[i]);
    return hi;
  };
  // past 92% on independent runs, or past 95% in the labs' own numbers: the test no longer separates top models
  const nearCeiling = (id: string) => {
    const [, , , unit, better] = p.benches[inBuilder.get(id)!];
    return unit === '%' && better > 0 && (top(p.ind[inBuilder.get(id)!] ?? []) >= 92 || top(p.lab[inBuilder.get(id)!] ?? []) >= 95);
  };

  // 1. the families the most labs reported this year that still separate models, each as the version reported this
  // year that the most models from the last six months have
  const reported: { f: string; id: string; labs: number }[] = [];
  for (const [f, s] of [...labsYear.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))) {
    const v = (members.get(f) ?? [])
      .filter((id) => (versionYear.get(id) ?? 0) > 0 && nInd(id) >= p.minModels)
      .sort((a, b) => recent(b) - recent(a) || (versionYear.get(b) ?? 0) - (versionYear.get(a) ?? 0))[0];
    if (!v || nearCeiling(v)) continue;
    reported.push({ f, id: v, labs: s.size });
    if (reported.length === 8) break;
  }
  const out: Preset[] = [
    {
      id: 'reported',
      name: `The ${reported.length} tests most labs reported in ${year}`,
      how: `The benchmark families named by the most labs in their own ${year} launch posts and system cards (from ${reported[0]?.labs} labs down to ${reported.at(-1)?.labs}), leaving out any where top models score past 92%. Each comes as the version the most models from the last six months have.`,
      b: reported.map((x) => x.id),
    },
  ];

  // 2. one per area: tests at least two labs reported in the last 18 months, with independent scores for the most
  // recent models. One version per family. Votes and head-to-head matches stay out, and so do tests near the ceiling.
  const VOTES = new Set(['preference', 'head-to-head']);
  const area = (pid: string, label: string, keep: (b: Benchmark) => boolean) => {
    const best = new Map<string, { id: string; n: number }>();
    for (const [id] of p.benches) {
      const b = benchById.get(id)!;
      // a second metric of one benchmark (ProgramBench and ProgramBench almost solved) counts once
      if (/-(almost|tests-passed)$/.test(id) && inBuilder.has(id.replace(/-(almost|tests-passed)$/, ''))) continue;
      if (!keep(b) || VOTES.has(b.scoring ?? '') || nInd(id) < p.minModels) continue;
      if ((labsRecent.get(famOf(id))?.size ?? 0) < 2) continue;
      if (nearCeiling(id)) continue;
      const n = recent(id);
      const f = famOf(id);
      if (n > (best.get(f)?.n ?? 0)) best.set(f, { id, n });
    }
    const ids = [...best.values()].sort((a, b) => b.n - a.n || a.id.localeCompare(b.id)).slice(0, 6);
    return {
      id: pid,
      name: `${ids.length} ${label} tests`,
      how: `${label[0].toUpperCase()}${label.slice(1)} benchmarks that at least two labs reported in the last 18 months, each as the version the most models from the last six months have. One version each, leaving out vote-based boards and any test past 92%.`,
      b: ids.map((x) => x.id),
    };
  };
  const cat = (...cs: string[]) => (b: Benchmark) => cs.includes(b.category ?? '');
  const ar = (a: string) => (b: Benchmark) => areaOf(b.category) === a;
  out.push(area('agents', 'agent', ar('agents')));
  out.push(area('code', 'coding', ar('code')));
  out.push(area('math', 'math', cat('math')));
  out.push(area('science', 'science', cat('science-reasoning')));
  out.push(area('work', 'professional work', ar('work')));
  return out.filter((x) => x.b.length >= 2);
}
