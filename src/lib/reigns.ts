// Who held number one, and when. A model takes the top spot on the day a score beats every earlier score
// (its release date for independent runs, the card's date for lab claims). It keeps the spot until a
// later model beats it. Ties leave the incumbent in place.
//
// The clock that counts time at number one stops at the first of three moments:
//   - the best score passes 85%: the benchmark is saturated, and nobody can take the lead in a way that
//     means much. The model that took it past 85% gets a close-out instead, counted on its own.
//   - the next version comes out (Terminal-Bench 2.0 retires 1.0).
//   - the newest model tested: after that, nobody knows who would lead.
import { epochScores, cardScores, leaderboardScores, benchById, benchmarks, modelById, eciByModel, models, AS_OF, SATURATED } from './data.ts';
import type { Score } from './types.ts';

export type Source = 'leaderboard' | 'epoch' | 'card';

export interface Reign {
  model: string;
  lab?: string;
  start: string;
  end: string;
  /** Best score while this model held the top spot, one step per improvement. */
  steps: { date: string; value: number }[];
}

export interface CloseOut {
  date: string;
  model: string;
  lab?: string;
  value: number;
}

export interface ReignRow {
  benchmark: string;
  source: Source;
  unit: string;
  reigns: Reign[];
  /** Range used to draw heights: 0 to 100 for percentages, else the data's range. */
  domain: [number, number];
  /** Date of the newest score: the last model tested, or the last card that reported it. */
  lastTested: string;
  /** The score that first passed 85%, for percentage benchmarks where higher is better. */
  closedOut?: CloseOut;
  /** The next version of the same test, and the day it came out. */
  replacedBy?: { benchmark: string; date: string };
}

function build(points: { date: string; value: number; model: string }[], better: 'higher' | 'lower', unit: string): Omit<ReignRow, 'benchmark' | 'source'> | null {
  const pts = points.filter((p) => p.date && p.date <= AS_OF).sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 3) return null;
  const sign = better === 'lower' ? -1 : 1;
  // Of the scores dated the same day, only the best can lead. The others would be reigns of zero days.
  const bestOfDay = new Map<string, (typeof pts)[number]>();
  for (const p of pts) {
    const q = bestOfDay.get(p.date);
    if (!q || sign * p.value > sign * q.value) bestOfDay.set(p.date, p);
  }
  const top = [...bestOfDay.values()];
  const reigns: Reign[] = [];
  for (const p of top) {
    const cur = reigns.at(-1);
    const best = cur?.steps.at(-1)?.value;
    if (best !== undefined && sign * p.value <= sign * best) continue;
    if (cur && cur.model === p.model) {
      cur.steps.push({ date: p.date, value: p.value });
      continue;
    }
    if (cur) cur.end = p.date;
    reigns.push({ model: p.model, lab: modelById.get(p.model)?.lab, start: p.date, end: AS_OF, steps: [{ date: p.date, value: p.value }] });
  }
  const vals = pts.map((p) => p.value);
  const domain: [number, number] = unit === '%' ? [0, 100] : [Math.min(0, ...vals), Math.max(...vals)];
  const lastTested = pts.at(-1)!.date;
  const first = unit === '%' && better === 'higher' ? pts.find((p) => p.value >= SATURATED) : undefined;
  const closedOut = first ? { date: first.date, model: first.model, lab: modelById.get(first.model)?.lab, value: first.value } : undefined;
  return { unit, reigns, domain, lastTested, closedOut };
}

const cache = new Map<string, ReignRow | null>();

export function reignRow(benchmark: string, source: Source): ReignRow | null {
  const k = `${benchmark}|${source}`;
  if (cache.has(k)) return cache.get(k)!;
  const b = benchById.get(benchmark);
  let row: ReignRow | null = null;
  if (b) {
    const unit = b.unit ?? '%';
    const scores: Score[] = (source === 'leaderboard' ? leaderboardScores : source === 'epoch' ? epochScores : cardScores).filter(
      (s) => s.benchmark === benchmark && s.unit === unit,
    );
    // Epoch places scores at each model's release date, so a model older than the benchmark would seem to
    // lead before the benchmark existed. Nobody held a top spot until the benchmark came out.
    const opened = b.released ? `${b.released.slice(0, 7)}-01` : '';
    const built = build(
      scores.map((s) => ({ date: s.date && s.date < opened ? opened : (s.date ?? ''), value: s.value, model: s.model })),
      b.better === 'lower' ? 'lower' : 'higher',
      unit,
    );
    row = built ? { benchmark, source, ...built, replacedBy: nextVersion(benchmark) } : null;
  }
  cache.set(k, row);
  return row;
}

/** The version that retired this one, if the benchmark belongs to a family. */
export function nextVersion(benchmark: string): { benchmark: string; date: string } | undefined {
  const b = benchById.get(benchmark);
  if (!b?.family || !b.released) return undefined;
  const fam = benchmarks.filter((x) => x.family === b.family && x.released).sort((x, y) => x.released!.localeCompare(y.released!));
  const next = fam[fam.findIndex((x) => x.id === b.id) + 1];
  return next ? { benchmark: next.id, date: `${next.released!.slice(0, 7)}-01` } : undefined;
}

/** All versions of a benchmark's family, oldest first. */
export function familyOf(benchmark: string): string[] {
  const b = benchById.get(benchmark);
  if (!b?.family) return [benchmark];
  return benchmarks
    .filter((x) => x.family === b.family)
    .sort((x, y) => (x.released ?? '').localeCompare(y.released ?? ''))
    .map((x) => x.id);
}

/** Number one on the Epoch Capabilities Index, by release date. The index has no ceiling, so it never closes out. */
export function eciReigns(): ReignRow | null {
  const pts = models.filter((m) => eciByModel.has(m.id) && m.released).map((m) => ({ date: m.released!, value: eciByModel.get(m.id)!.eci, model: m.id }));
  const built = build(pts, 'higher', 'index');
  return built ? { benchmark: 'eci', source: 'epoch', ...built, closedOut: undefined } : null;
}

const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

export type StopReason = 'closed' | 'replaced' | 'untested';

/** The moment the clock stopped and why, or null while the benchmark is still contested. */
export function clockStop(r: ReignRow): { date: string; why: StopReason } | null {
  const cands: { date: string; why: StopReason }[] = [];
  if (r.closedOut) cands.push({ date: r.closedOut.date, why: 'closed' });
  if (r.replacedBy) cands.push({ date: r.replacedBy.date, why: 'replaced' });
  // a benchmark nobody has tested for six weeks: the leader is only the leader of what was tested
  if (days(r.lastTested, AS_OF) > 45) cands.push({ date: r.lastTested, why: 'untested' });
  const live = cands.filter((c) => c.date < AS_OF).sort((a, b) => a.date.localeCompare(b.date));
  // testing usually stops a little before the next version ships: call that a replacement
  const rep = live.find((c) => c.why === 'replaced');
  if (live[0]?.why === 'untested' && rep && days(live[0].date, rep.date) <= 120) return rep;
  return live[0] ?? null;
}

/** When the clock stops: today, unless it stopped earlier. */
export function clockStops(r: ReignRow): string {
  return clockStop(r)?.date ?? AS_OF;
}

/** Contested days of a reign: from its start, or `since`, to its end or the moment the clock stopped. */
export function contestedDays(g: Reign, r: ReignRow, since = '2023-01-01'): number {
  const s = g.start < since ? since : g.start;
  const stop = clockStops(r);
  const e = g.end < stop ? g.end : stop;
  return Math.max(0, days(s, e));
}

/** Share of contested benchmark-days each lab held number one, across the given rows. */
export function labShares(rows: ReignRow[], since = '2023-01-01'): { lab: string; days: number; share: number }[] {
  const tot = new Map<string, number>();
  let all = 0;
  for (const r of rows)
    for (const g of r.reigns) {
      const d = contestedDays(g, r, since);
      if (d <= 0) continue;
      const lab = g.lab ?? 'other';
      tot.set(lab, (tot.get(lab) ?? 0) + d);
      all += d;
    }
  return [...tot.entries()].map(([lab, d]) => ({ lab, days: d, share: all ? d / all : 0 })).sort((a, b) => b.days - a.days);
}

/** Close-outs across the given rows, newest first: the model that took each benchmark past 85%. */
export function closeOuts(rows: ReignRow[], since = '2023-01-01'): (CloseOut & { benchmark: string; source: Source })[] {
  return rows
    .filter((r) => r.closedOut && r.closedOut.date >= since)
    .map((r) => ({ ...r.closedOut!, benchmark: r.benchmark, source: r.source }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Close-outs per lab, most first. */
export function closeOutShares(rows: ReignRow[], since = '2023-01-01'): { lab: string; count: number; share: number }[] {
  const list = closeOuts(rows, since);
  const tot = new Map<string, number>();
  for (const c of list) tot.set(c.lab ?? 'other', (tot.get(c.lab ?? 'other') ?? 0) + 1);
  return [...tot.entries()].map(([lab, count]) => ({ lab, count, share: list.length ? count / list.length : 0 })).sort((a, b) => b.count - a.count);
}

export const reignDays = (g: { start: string; end: string }) => days(g.start, g.end);
