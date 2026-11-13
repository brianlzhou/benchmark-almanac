// Who held number one, and when. A model takes the top spot on the day a score beats every earlier score
// (its release date for independent runs, the card's date for lab claims). It keeps the spot until a
// later model beats it. Ties leave the incumbent in place. A pooled row ('all', or 'independent') takes
// every score from its sources, so the top spot goes to the best score anyone had reported so far. The
// 'headline' row takes only the source the benchmark's page leads with (data.ts boardSource), so who leads and
// who closed it out agree with that page.
//
// The clock that counts time at number one stops at the first of two moments:
//   - the best score passes 85%: the benchmark is saturated, and nobody can take the lead in a way that
//     means much. The model that took it past 85% gets a close-out instead, counted on its own.
//   - the newest model tested, once six weeks pass with no newer one: after that, nobody knows who would lead.
// Between those, the clock runs only while someone else is racing. A lab gets IDLE_DAYS from the day it takes
// the top spot, and IDLE_DAYS more from each score another lab's model gets. Its own later models don't count, so
// a lab that is the only one still reporting a benchmark can't run up its time alone.
// A new version does not stop the old one's clock. While people still test the old version its race goes
// on, and whoever closes it out gets the credit (ARC-AGI-2 came out in March 2025, long before anyone took
// ARC-AGI-1 past 85%). When testing stopped around the time the next version came out, the stop reads as
// a replacement.
import { epochScores, cardScores, leaderboardScores, viaBoardScores, collectedClaims, benchById, benchmarks, benchSummary, modelById, eciByModel, models, AS_OF, SATURATED } from './data.ts';
import type { Score } from './types.ts';

/** The thresholds a reader can pick for a close-out. The first is the one the clock stops at. */
export const CLOSE_LEVELS = [SATURATED, 90, 95];

/**
 * Where a score came from: the benchmark's own leaderboard, Epoch AI's run, a board Epoch AI copied that we don't
 * read ourselves ('collected'), a lab's own card, or a claim Epoch AI collected from a lab's report or a paper.
 */
export type Origin = 'leaderboard' | 'epoch' | 'collected' | 'card' | 'claim';
/**
 * One source, or a pool. 'headline' takes the one source the benchmark's page leads with. 'independent' takes
 * every independent run (leaderboard, Epoch AI, boards Epoch AI copied). 'all' adds labs' own numbers and the
 * claims Epoch AI collected.
 */
export type Source = Origin | 'all' | 'independent' | 'headline';
export const INDEPENDENT: Origin[] = ['leaderboard', 'epoch', 'collected'];
export const EVERY: Origin[] = ['leaderboard', 'epoch', 'collected', 'card', 'claim'];

export interface Reign {
  model: string;
  lab?: string;
  start: string;
  end: string;
  /** Best score while this model held the top spot, one step per improvement, and where each came from. */
  steps: { date: string; value: number; from?: Origin }[];
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
  /** The score that first reached each of CLOSE_LEVELS, for the close-out threshold a reader can pick. */
  crossings?: Partial<Record<number, CloseOut>>;
  /** Every day a score came in, with the lab of each model scored that day. */
  scored?: { date: string; labs: string[] }[];
  /** The next version of the same test, and the day it came out. */
  replacedBy?: { benchmark: string; date: string };
}

type Point = { date: string; value: number; model: string; from?: Origin };

function build(points: Point[], better: 'higher' | 'lower', unit: string): Omit<ReignRow, 'benchmark' | 'source'> | null {
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
      cur.steps.push({ date: p.date, value: p.value, from: p.from });
      continue;
    }
    if (cur) cur.end = p.date;
    reigns.push({ model: p.model, lab: modelById.get(p.model)?.lab, start: p.date, end: AS_OF, steps: [{ date: p.date, value: p.value, from: p.from }] });
  }
  const vals = pts.map((p) => p.value);
  const domain: [number, number] = unit === '%' ? [0, 100] : [Math.min(0, ...vals), Math.max(...vals)];
  const lastTested = pts.at(-1)!.date;
  // the close-out goes to the best score on the first day any score passed 85%: when a new benchmark opens,
  // many older models get their scores on the same day, and the credit belongs to the one that led
  const day = unit === '%' && better === 'higher' ? pts.find((p) => p.value >= SATURATED)?.date : undefined;
  const first = day ? bestOfDay.get(day) : undefined;
  const closedOut = first ? { date: first.date, model: first.model, lab: modelById.get(first.model)?.lab, value: first.value } : undefined;
  const crossings: Partial<Record<number, CloseOut>> = {};
  if (unit === '%' && better === 'higher')
    for (const t of CLOSE_LEVELS) {
      const d = pts.find((p) => p.value >= t)?.date;
      const f = d ? bestOfDay.get(d) : undefined;
      if (f) crossings[t] = { date: f.date, model: f.model, lab: modelById.get(f.model)?.lab, value: f.value };
    }
  const byDay = new Map<string, Set<string>>();
  for (const p of pts) {
    const l = byDay.get(p.date) ?? new Set<string>();
    l.add(modelById.get(p.model)?.lab ?? p.model);
    byDay.set(p.date, l);
  }
  const scored = [...byDay.entries()].map(([date, labs]) => ({ date, labs: [...labs] }));
  return { unit, reigns, domain, lastTested, closedOut, crossings, scored };
}

const cache = new Map<string, ReignRow | null>();
// each source's scores by benchmark, so a pooled row does not scan every score
const byBench = (xs: Score[]) => {
  const m = new Map<string, Score[]>();
  for (const s of xs) {
    const l = m.get(s.benchmark);
    if (l) l.push(s);
    else m.set(s.benchmark, [s]);
  }
  return m;
};
const scoresOf = new Map<Origin, Map<string, Score[]>>([
  ['leaderboard', byBench(leaderboardScores)],
  ['epoch', byBench(epochScores)],
  ['collected', byBench(viaBoardScores)],
  ['card', byBench(cardScores)],
  ['claim', byBench(collectedClaims)],
]);

/** The sources a pool takes for one benchmark. */
export function originsOf(benchmark: string, source: Source): Origin[] {
  if (source === 'all') return EVERY;
  if (source === 'independent') return INDEPENDENT;
  if (source === 'headline') {
    const h = benchSummary(benchmark).boardSource;
    return h ? [h] : [];
  }
  return [source];
}

export function reignRow(benchmark: string, source: Source): ReignRow | null {
  const k = `${benchmark}|${source}`;
  if (cache.has(k)) return cache.get(k)!;
  const b = benchById.get(benchmark);
  let row: ReignRow | null = null;
  if (b) {
    const unit = b.unit ?? '%';
    const origins = originsOf(benchmark, source);
    const scores: (Score & { from: Origin })[] = origins.flatMap((o) =>
      (scoresOf.get(o)!.get(benchmark) ?? []).filter((s) => s.unit === unit).map((s) => ({ ...s, from: o })),
    );
    // Epoch places scores at each model's release date, so a model older than the benchmark would seem to
    // lead before the benchmark existed. Nobody held a top spot until the benchmark came out.
    const opened = b.released ? `${b.released.slice(0, 7)}-01` : '';
    const built = build(
      scores.map((s) => ({ date: s.date && s.date < opened ? opened : (s.date ?? ''), value: s.value, model: s.model, from: s.from })),
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
  return built ? { benchmark: 'eci', source: 'epoch', ...built, closedOut: undefined, crossings: undefined } : null;
}

const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

export type StopReason = 'closed' | 'replaced' | 'untested';

/** The moment the clock stopped and why, or null while the benchmark is still contested. */
export function clockStop(r: ReignRow): { date: string; why: StopReason } | null {
  const cands: { date: string; why: StopReason }[] = [];
  if (r.closedOut) cands.push({ date: r.closedOut.date, why: 'closed' });
  // a benchmark nobody has tested for six weeks: the leader is only the leader of what was tested
  if (days(r.lastTested, AS_OF) > 45) cands.push({ date: r.lastTested, why: 'untested' });
  const first = cands.filter((c) => c.date < AS_OF).sort((a, b) => a.date.localeCompare(b.date))[0];
  // testing usually stops a little before the next version ships, or soon after: call that a replacement
  const rep = r.replacedBy;
  if (first?.why === 'untested' && rep && rep.date < AS_OF && Math.abs(days(first.date, rep.date)) <= 120) return { date: rep.date < first.date ? first.date : rep.date, why: 'replaced' };
  return first ?? null;
}

/** When the clock stops: today, unless it stopped earlier. */
export function clockStops(r: ReignRow): string {
  return clockStop(r)?.date ?? AS_OF;
}

/** How long a lab's clock runs with nobody else tested: from taking the top spot, and from each other lab's score. */
export const IDLE_DAYS = 45;
const plus = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * Contested days of a reign: from its start, or `since`, to its end or the moment the clock stopped, counting
 * only the IDLE_DAYS after the lab took the top spot and after each score from another lab's model.
 */
export function contestedDays(g: Reign, r: ReignRow, since = '2023-01-01'): number {
  const s = g.start < since ? since : g.start;
  const stop = clockStops(r);
  const e = g.end < stop ? g.end : stop;
  if (e <= s) return 0;
  if (!r.scored) return days(s, e);
  // the lab took the top spot at the start of its streak: one of its own models handing over to the next keeps it
  const lab = g.lab ?? g.model;
  let i = r.reigns.indexOf(g);
  while (i > 0 && (r.reigns[i - 1].lab ?? r.reigns[i - 1].model) === lab) i--;
  const opens = [r.reigns[i]?.start ?? g.start, ...r.scored.filter((x) => x.labs.some((l) => l !== lab)).map((x) => x.date)].sort();
  let tot = 0;
  let reach = s;
  for (const o of opens) {
    const a = o > reach ? o : reach;
    const b = plus(o, IDLE_DAYS) < e ? plus(o, IDLE_DAYS) : e;
    if (b > a) {
      tot += days(a, b);
      reach = b;
    }
  }
  return tot;
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

const closeAt = (r: ReignRow, t: number) => (t === SATURATED ? r.closedOut : r.crossings?.[t]);

/** Close-outs across the given rows, newest first: the model that took each benchmark past the threshold. */
export function closeOuts(rows: ReignRow[], since = '2023-01-01', t = SATURATED): (CloseOut & { benchmark: string; source: Source })[] {
  return rows
    .filter((r) => (closeAt(r, t)?.date ?? '') >= since)
    .map((r) => ({ ...closeAt(r, t)!, benchmark: r.benchmark, source: r.source }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Close-outs per lab, most first. */
export function closeOutShares(rows: ReignRow[], since = '2023-01-01', t = SATURATED): { lab: string; count: number; share: number }[] {
  const list = closeOuts(rows, since, t);
  const tot = new Map<string, number>();
  for (const c of list) tot.set(c.lab ?? 'other', (tot.get(c.lab ?? 'other') ?? 0) + 1);
  return [...tot.entries()].map(([lab, count]) => ({ lab, count, share: list.length ? count / list.length : 0 })).sort((a, b) => b.count - a.count);
}

export const reignDays = (g: { start: string; end: string }) => days(g.start, g.end);
