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
  const nLab = (id: string) => (p.lab[inBuilder.get(id)!]?.length ?? 0) / 2;
  // the member of a family to use: the one with the most independent runs, then the most lab numbers, then the newest
  const members = new Map<string, string[]>();
  for (const [id] of p.benches) (members.get(famOf(id)) ?? members.set(famOf(id), []).get(famOf(id))!).push(id);
  const pickMember = (fam: string) =>
    (members.get(fam) ?? [])
      .slice()
      .sort((a, b) => nInd(b) - nInd(a) || nLab(b) - nLab(a) || (benchById.get(b)?.released ?? '').localeCompare(benchById.get(a)?.released ?? ''))[0];

  // 1. the families the most labs reported in their 2026 launch posts and documents
  const year = AS_OF.slice(0, 4);
  const labsBy = new Map<string, Set<string>>();
  for (const d of [...cards, ...systemCards]) {
    if (!d.date?.startsWith(year)) continue;
    for (const r of d.results) {
      const b = benchById.get(r.benchmark);
      if (!b || NOT_CAPABILITY.has(areaOf(b.category))) continue;
      const f = famOf(r.benchmark);
      (labsBy.get(f) ?? labsBy.set(f, new Set()).get(f)!).add(d.lab);
    }
  }
  const top = [...labsBy.entries()]
    .filter(([f]) => members.has(f))
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .slice(0, 8);
  const out: Preset[] = [
    {
      id: 'reported',
      name: `The ${top.length} tests most labs reported in ${year}`,
      how: `The benchmark families the most labs named in their own ${year} launch posts and system cards, ${top
        .slice(0, 3)
        .map(([, s]) => s.size)
        .join(', ')} and so on labs each, using the version with the most independent runs.`,
      b: top.map(([f]) => pickMember(f)).filter(Boolean),
    },
  ];

  // 2. one per area: the busiest boards for recent models, one version per family, leaving out tests near the ceiling
  const since = new Date(Date.parse(AS_OF) - 548 * 864e5).toISOString().slice(0, 10);
  const recent = (id: string) => {
    const list = p.ind[inBuilder.get(id)!] ?? [];
    let n = 0;
    for (let i = 0; i < list.length; i += 2) if ((p.models[list[i]][3] ?? '') >= since) n++;
    return n;
  };
  const ceiling = (id: string) => {
    const list = p.ind[inBuilder.get(id)!] ?? [];
    let top = -Infinity;
    for (let i = 1; i < list.length; i += 2) top = Math.max(top, list[i]);
    return top;
  };
  const area = (pid: string, label: string, keep: (b: Benchmark) => boolean) => {
    const best = new Map<string, { id: string; n: number }>();
    for (const [id, , , unit, better] of p.benches) {
      const b = benchById.get(id)!;
      if (!keep(b) || nInd(id) < p.minModels) continue;
      if (unit === '%' && better > 0 && ceiling(id) >= 92) continue;
      const n = recent(id);
      const f = famOf(id);
      if (n > (best.get(f)?.n ?? 0)) best.set(f, { id, n });
    }
    const ids = [...best.values()].sort((a, b) => b.n - a.n || a.id.localeCompare(b.id)).slice(0, 6);
    return {
      id: pid,
      name: `${ids.length} ${label} tests`,
      how: `The ${label} benchmarks with independent scores for the most models released in the last 18 months, one version each, leaving out any where the best score is past 92%.`,
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
