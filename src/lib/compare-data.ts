// The Compare page's data: a small list of models for the picker (/compare/models.json) and one small file per
// model with its best score on each benchmark from each source (/compare/m/<id>.json). The page fetches only the
// files of the models it shows. Every model with a page of its own gets a file when it has any score. Models
// without a page have too few scores to share more than a test or two with anything. The math is in compare.ts.
import { benchmarks, labs, modelById, eciByModel, cards, systemCards, benchSummary, featuredModels, AS_OF } from './data.ts';
import { areaOf } from './taxonomy.ts';
import { labColor } from './palette.ts';
import { COLOR_MARKS, MONO_MARKS } from './marks.ts';
import { FRONTIER } from './reporting-view.ts';
import type { FileRow, LabInfo, ModelFile, ModelIndex } from './compare.ts';

/** Three decimals at most: enough for a Brier score, small in the file. */
const r3 = (v: number) => Math.round(v * 1000) / 1000;

let built: { files: Map<string, ModelFile>; index: ModelIndex } | null = null;

function build() {
  if (built) return built;
  const featured = new Set(featuredModels.map((m) => m.id));
  // the benchmarks each model's own launch posts and system cards report, with or without a number
  const cited = new Map<string, Set<string>>();
  for (const d of [...cards, ...systemCards]) {
    let s = cited.get(d.model);
    if (!s) cited.set(d.model, (s = new Set()));
    for (const r of d.results) s.add(r.benchmark);
  }
  const rowsBy = new Map<string, FileRow[]>();
  for (const b of benchmarks) {
    // a cost per task is not a skill, as on /build/
    if ((b.unit ?? '%') === 'usd') continue;
    const s = benchSummary(b.id);
    const sign = b.better === 'lower' ? -1 : 1;
    // independent: the benchmark's own leaderboard and Epoch AI's runs, the better of the two for each model
    const ind = new Map<string, { v: number; from: 'b' | 'e' }>();
    for (const x of s.leaderboardBoard) ind.set(x.model, { v: x.value, from: 'b' });
    for (const x of s.epochBoard) {
      const cur = ind.get(x.model);
      if (!cur || sign * x.value > sign * cur.v) ind.set(x.model, { v: x.value, from: 'e' });
    }
    const lab = new Map(s.cardBoard.map((x) => [x.model, x.value]));
    const ids = [...new Set([...ind.keys(), ...lab.keys()])].filter((id) => featured.has(id));
    if (!ids.length) continue;
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of [...[...ind.values()].map((x) => x.v), ...lab.values()]) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    // the site-wide count of labs that report it, the same one /reporting/ and /contribute/ use
    const nLabs = new Set([...s.labs, ...s.docLabs]).size;
    const area = areaOf(b.category);
    for (const id of ids) {
      const i = ind.get(id);
      const l = lab.get(id);
      const row: FileRow = [b.id, b.name, area, b.unit ?? '%', sign, nLabs, r3(lo), r3(hi), i ? r3(i.v) : null, i?.from ?? '', l === undefined ? null : r3(l), cited.get(id)?.has(b.id) ? 1 : 0];
      let list = rowsBy.get(id);
      if (!list) rowsBy.set(id, (list = []));
      list.push(row);
    }
  }
  const files = new Map<string, ModelFile>();
  for (const [id, rows] of rowsBy) {
    const m = modelById.get(id)!;
    rows.sort((a, b) => b[5] - a[5] || a[1].localeCompare(b[1], 'en'));
    files.set(id, { v: 1, id, name: m.name, lab: m.lab ?? '', rows });
  }
  const list = [...files.values()]
    .map((f) => {
      const m = modelById.get(f.id)!;
      const e = eciByModel.get(f.id)?.eci;
      return [f.id, f.name, f.lab, m.released ?? '', f.rows.length, e === undefined ? null : Math.round(e * 10) / 10] as ModelIndex['models'][number];
    })
    .sort((a, b) => (b[5] ?? -1e9) - (a[5] ?? -1e9) || b[4] - a[4] || a[1].localeCompare(b[1], 'en'));
  const used = new Set(list.map((x) => x[2]).filter(Boolean));
  const labMap: Record<string, LabInfo> = {};
  for (const l of labs) if (used.has(l.id)) labMap[l.id] = [l.name, COLOR_MARKS.has(l.id) ? 'c' : MONO_MARKS.has(l.id) ? 'm' : '', labColor(l.id)];
  built = { files, index: { v: 1, asOf: AS_OF, labs: labMap, models: list } };
  return built;
}

export const compareIndex = (): ModelIndex => build().index;
export const compareFile = (id: string): ModelFile | undefined => build().files.get(id);
export const compareIds = (): string[] => [...build().files.keys()];

/** The default view: the highest-ranked model on the Epoch Capabilities Index from each frontier lab, top four. */
export function defaultPicks(): string[] {
  const best = new Map<string, { id: string; eci: number }>();
  for (const [id, e] of eciByModel) {
    const lab = modelById.get(id)?.lab;
    if (!lab || !FRONTIER.has(lab) || !build().files.has(id)) continue;
    const cur = best.get(lab);
    if (!cur || e.eci > cur.eci) best.set(lab, { id, eci: e.eci });
  }
  return [...best.values()]
    .sort((a, b) => b.eci - a.eci)
    .slice(0, 4)
    .map((x) => x.id);
}

const sets = new Map<string, Set<string>>();
function benchSet(id: string): Set<string> {
  let s = sets.get(id);
  if (!s) sets.set(id, (s = new Set(build().files.get(id)?.rows.map((r) => r[0]) ?? [])));
  return s;
}

/**
 * The model a model page's "Compare" link pairs it with: a model from another lab, released within six months of
 * it, that shares the most benchmarks with it. Ties go to the higher ECI. Without one, any model sharing the most.
 */
export function rivalOf(id: string): string | undefined {
  const me = modelById.get(id);
  if (!me || !build().files.has(id)) return undefined;
  const mine = benchSet(id);
  const day = (d: string) => Date.parse(d.length === 7 ? `${d}-01` : d);
  const t = me.released ? day(me.released) : NaN;
  let best: { id: string; k: number; eci: number; near: boolean; other: boolean } | undefined;
  for (const other of build().files.keys()) {
    if (other === id) continue;
    const m = modelById.get(other)!;
    const theirs = benchSet(other);
    let k = 0;
    for (const b of theirs) if (mine.has(b)) k++;
    if (!k) continue;
    const near = !Number.isNaN(t) && !!m.released && Math.abs(day(m.released) - t) <= 183 * 864e5;
    const cand = { id: other, k, eci: eciByModel.get(other)?.eci ?? -1e9, near, other: m.lab !== me.lab };
    const rank = (x: typeof cand) => (x.near && x.other ? 2 : x.near || x.other ? 1 : 0);
    if (!best || rank(cand) > rank(best) || (rank(cand) === rank(best) && (cand.k > best.k || (cand.k === best.k && cand.eci > best.eci)))) best = cand;
  }
  return best?.id;
}
