// The computed sections of the model and lab pages. For a model: where it held number one, how it does against
// models from other labs released near it, what it costs on boards that publish a price, and who measured it. For a
// lab: its share of number one over time, how often it releases models, the benchmarks it made and the ones it
// carries, and how its numbers compare with independent runs. About 1,400 model pages and 100 lab pages ask for
// these, so each lookup across the whole catalog is built once per build (memo) and a page reads only its slice.

import { benchmarks, benchById, benchSummary, models, modelById, labById, eciByModel, leaderboardScores, epochScores, viaBoardScores, cardScores, collectedClaims, LEADERBOARDS, AS_OF, type BenchSummary } from './data.ts';
import { reignRow, clockStop, contestedDays, type Reign, type ReignRow, type StopReason } from './reigns.ts';
import { leaderRows } from './leaders.ts';
import { makerParts } from './makers.ts';
import { claimPairs, claimStats, labOfPair, type ClaimPair } from './claims.ts';
import { leadTrend, carried, type Period, type Carried } from './insights.ts';
import { RANKED_BY_PEOPLE_OR_MATCHES, AREAS } from './taxonomy.ts';
import { featuredIds } from './routes.ts';
import { labColor, LAB_SLOTS } from './palette.ts';
import type { Benchmark, Score } from './types.ts';

const DAY = 864e5;
const daysBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / DAY));
const memo = <T>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};
const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const l = m.get(k);
  if (l) l.push(v);
  else m.set(k, [v]);
};
export const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const i = s.length >> 1;
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
};
const sign = (b: Pick<Benchmark, 'better'>) => (b.better === 'lower' ? -1 : 1);

// ---------------------------------------------------------------------------------------------------------------
// Where a model held number one: on each benchmark's main board (the source its page leads with), percentage
// benchmarks with five or more models that models from two or more labs race on, as the Leaders page counts them.

/**
 * Whether two or more labs race on the benchmark's main board: two labs with scores, and an independent run, or
 * (when every score is a lab's own) two labs besides the benchmark's makers. The rule of leaders.ts contested().
 */
function contested(s: BenchSummary): boolean {
  const labs = new Set(s.board.map((x) => modelById.get(x.model)?.lab).filter((l): l is string => !!l));
  if (labs.size < 2) return false;
  if (s.board.some((x) => x.source !== 'card' && !(x.source === 'collected' && x.via !== 'board'))) return true;
  const makers = new Set(makerParts(s.b.org ?? '').map((p) => p.lab).filter(Boolean));
  return makers.size === 0 || [...labs].filter((l) => !makers.has(l)).length >= 2;
}

export interface HeldRow {
  b: Benchmark;
  row: ReignRow;
  /** The model's own reigns, oldest first. */
  mine: Reign[];
  /** It holds number one today. */
  now: boolean;
  /** Why the race stopped, when it has: past 85%, nobody tested for six weeks, or a new version replaced it. */
  stop: { date: string; why: StopReason } | null;
  /** The model that took the top spot from it, and when. */
  lost?: { model: string; date: string };
  /** Days at number one, every reign together, to today for one still going. */
  days: number;
  /** Its best score at number one. */
  best: number;
  /** Models on the main board. */
  of: number;
}

const heldIndex = memo(() => {
  const by = new Map<string, HeldRow[]>();
  for (const b of benchmarks) {
    if ((b.unit ?? '%') !== '%' || RANKED_BY_PEOPLE_OR_MATCHES.has(b.scoring ?? '')) continue;
    const s = benchSummary(b.id);
    if (s.board.length < 5 || !s.boardSource || !contested(s)) continue;
    // a board of labs' own numbers crowns no one: a lab's claim never makes its model number one
    if (s.boardSource === 'card' || s.boardSource === 'claim') continue;
    const row = reignRow(b.id, 'headline');
    if (!row?.reigns.length) continue;
    const stop = clockStop(row);
    for (const model of new Set(row.reigns.map((g) => g.model))) {
      const mine = row.reigns.filter((g) => g.model === model);
      const last = mine.at(-1)!;
      const next = row.reigns[row.reigns.indexOf(last) + 1];
      push(by, model, {
        b,
        row,
        mine,
        now: !next,
        stop,
        ...(next ? { lost: { model: next.model, date: next.start } } : {}),
        days: mine.reduce((a, g) => a + daysBetween(g.start, g.end), 0),
        best: last.steps.at(-1)!.value,
        of: s.board.length,
      });
    }
  }
  return by;
});

/**
 * The benchmarks where a model held number one: first the ones it leads in a race still going (the most models
 * first), then the ones it still tops that nobody tests anymore, then the ones it lost, the latest loss first.
 */
export function modelHeld(id: string): HeldRow[] {
  const group = (h: HeldRow) => (!h.now ? 2 : !h.stop || h.stop.why === 'closed' ? 0 : 1);
  const key = (h: HeldRow) => (group(h) === 0 ? String(1e6 - h.of).padStart(7, '0') : group(h) === 1 ? h.row.lastTested : h.lost!.date);
  return [...(heldIndex().get(id) ?? [])].sort((a, b) => group(a) - group(b) || (group(a) === 0 ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))) || a.b.name.localeCompare(b.b.name));
}

// ---------------------------------------------------------------------------------------------------------------
// Head to head: on every benchmark's main board, how often a model beats each model from another lab released
// within six months of it.

const mainBoards = memo(() => {
  const vals = new Map<string, Map<string, number>>();
  const benchesOf = new Map<string, string[]>();
  for (const b of benchmarks) {
    if ((b.unit ?? '%') === 'usd') continue;
    const s = benchSummary(b.id);
    if (s.board.length < 2) continue;
    const m = new Map(s.board.filter((x) => x.model).map((x) => [x.model, x.value]));
    vals.set(b.id, m);
    for (const id of m.keys()) push(benchesOf, id, b.id);
  }
  return { vals, benchesOf };
});

export interface Rival {
  model: string;
  shared: number;
  wins: number;
  losses: number;
  ties: number;
}
/** Rivals share at least this many benchmarks. */
export const RIVAL_MIN = 8;
const NEAR_DAYS = 183;

/**
 * Up to `n` rivals: models with their own page, from other labs, released within six months of this one, sharing at
 * least RIVAL_MIN benchmarks and at least a third as many as the most shared rival. Of those, the most evenly matched
 * (the smallest gap between wins and losses for each shared benchmark), listed by win share.
 */
export function headToHead(id: string, n = 6): Rival[] {
  const m = modelById.get(id);
  if (!m?.released) return [];
  const t = Date.parse(m.released);
  const { vals, benchesOf } = mainBoards();
  const tally = new Map<string, Rival>();
  for (const bid of benchesOf.get(id) ?? []) {
    const board = vals.get(bid)!;
    const mine = board.get(id)!;
    const sg = sign(benchById.get(bid)!);
    for (const [other, v] of board) {
      if (other === id || !featuredIds.has(other)) continue;
      const o = modelById.get(other);
      if (!o?.released || !o.lab || o.lab === m.lab || Math.abs(Date.parse(o.released) - t) > NEAR_DAYS * DAY) continue;
      const r = tally.get(other) ?? { model: other, shared: 0, wins: 0, losses: 0, ties: 0 };
      r.shared++;
      const d = sg * (mine - v);
      if (d > 0) r.wins++;
      else if (d < 0) r.losses++;
      else r.ties++;
      tally.set(other, r);
    }
  }
  // the ones it is most evenly matched with, among those that share at least a third as many benchmarks as the
  // most shared one, so a rival with eight shared benchmarks doesn't crowd out one with eighty
  const cands = [...tally.values()].filter((r) => r.shared >= RIVAL_MIN);
  const most = Math.max(0, ...cands.map((r) => r.shared));
  const even = (r: Rival) => Math.abs(r.wins - r.losses) / r.shared;
  return cands
    .filter((r) => r.shared >= most / 3)
    .sort((a, b) => even(a) - even(b) || b.shared - a.shared || a.model.localeCompare(b.model))
    .slice(0, n)
    .sort((a, b) => winShare(b) - winShare(a) || b.shared - a.shared);
}
/** Its share of the decided contests: wins over wins and losses. */
export const winShare = (r: Rival) => (r.wins + r.losses ? r.wins / (r.wins + r.losses) : 0.5);

// ---------------------------------------------------------------------------------------------------------------
// Cost: on boards that publish a price for five or more models, each model's best-scoring run that has a price
// (the cheaper one on a tie), from runs that count as the model's own score. Prices compare only within a board.

export interface CostRow {
  b: Benchmark;
  run: Score;
  /** Every model's priced run on the board, cheapest first. */
  field: { model: string; cost: number; value: number }[];
  median: number;
  /** Its price over the median model's. */
  ratio: number;
  /** 1 for the cheapest. */
  rank: number;
  /** No other model's run on the board scores as well for less. */
  frontier: boolean;
  /** The cheapest run of another model within NEAR of its score, when one costs less. */
  near?: { model: string; value: number; cost: number };
  per: 'task' | 'run';
}
const COST_MIN = 5;
/** "Close to its score": within two points on a percentage, or 2% of the score on any other scale. */
export const nearOf = (b: Benchmark, v: number) => ((b.unit ?? '%') === '%' ? 2 : Math.abs(v) * 0.02);

const costIndex = memo(() => {
  const byBench = new Map<string, Score[]>();
  for (const s of leaderboardScores) if (s.cost != null && s.cost > 0 && s.model) push(byBench, s.benchmark, s);
  const rows = new Map<string, CostRow[]>();
  for (const [bid, runs] of byBench) {
    const b = benchById.get(bid);
    if (!b) continue;
    const sg = sign(b);
    const best = new Map<string, Score>();
    for (const r of runs) {
      const cur = best.get(r.model);
      if (!cur || sg * r.value > sg * cur.value || (r.value === cur.value && r.cost! < cur.cost!)) best.set(r.model, r);
    }
    if (best.size < COST_MIN) continue;
    const field = [...best.values()].map((r) => ({ model: r.model, cost: r.cost!, value: r.value })).sort((a, b) => a.cost - b.cost);
    const med = median(field.map((x) => x.cost));
    for (const run of best.values()) {
      const frontier = !runs.some((o) => o.model !== run.model && o.cost! < run.cost! && sg * o.value >= sg * run.value);
      const tol = nearOf(b, run.value);
      const near = runs
        .filter((o) => o.model !== run.model && o.cost! < run.cost! && sg * o.value >= sg * run.value - tol)
        .reduce<Score | undefined>((a, o) => (!a || o.cost! < a.cost! ? o : a), undefined);
      push(rows, run.model, {
        b,
        run,
        field,
        median: med,
        ratio: run.cost! / med,
        rank: field.findIndex((x) => x.model === run.model) + 1,
        frontier,
        ...(near ? { near: { model: near.model, value: near.value, cost: near.cost! } } : {}),
        per: LEADERBOARDS[bid]?.costPer === 'run' ? 'run' : 'task',
      });
    }
  }
  return rows;
});

/** A model's price on each board that publishes prices, the boards with the most priced models first. */
export function modelCosts(id: string): CostRow[] {
  return [...(costIndex().get(id) ?? [])].sort((a, b) => b.field.length - a.field.length || a.b.name.localeCompare(b.b.name));
}

/** "$0.0042", "$0.53", "$12.40", "$1,240": three significant figures under $100, whole dollars above. */
export function money(v: number): string {
  if (v >= 100) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${Number(v.toPrecision(2))}`;
}

/** "2.1 times", "about the same as", "half", "a third of": a price ratio in words. */
export function ratioWords(r: number): string {
  if (r >= 0.9 && r <= 1.1) return 'about the same as';
  if (r > 1.1) return `${r < 10 ? r.toFixed(1) : Math.round(r)} times`;
  const inv = 1 / r;
  if (inv < 2.5) return `${Math.round(r * 100)}% of`;
  if (inv < 3.5) return 'about a third of';
  if (inv < 4.5) return 'about a quarter of';
  return `about 1/${Math.round(inv)} of`;
}

// ---------------------------------------------------------------------------------------------------------------
// Who measured a model: the benchmarks with a score from each source.

const sourceSets = memo(() => {
  const of = (xs: Score[]) => {
    const m = new Map<string, Set<string>>();
    for (const s of xs) {
      if (!s.model) continue;
      const set = m.get(s.model);
      if (set) set.add(s.benchmark);
      else m.set(s.model, new Set([s.benchmark]));
    }
    return m;
  };
  return { lb: of(leaderboardScores), epoch: of(epochScores), via: of(viaBoardScores), card: of(cardScores), claim: of(collectedClaims) };
});

export interface Coverage {
  total: number;
  /** Benchmarks with an independent run and a lab's or paper's number too. */
  both: number;
  /** Benchmarks with only an independent run. */
  indOnly: number;
  /** Benchmarks with only a claim: the lab's own number, or one Epoch AI collected from a report or paper. */
  claimOnly: number;
  lb: number;
  epoch: number;
  via: number;
}
export function coverage(id: string): Coverage {
  const S = sourceSets();
  const get = (k: keyof typeof S) => S[k].get(id) ?? new Set<string>();
  const ind = new Set([...get('lb'), ...get('epoch'), ...get('via')]);
  const claim = new Set([...get('card'), ...get('claim')]);
  const both = [...ind].filter((x) => claim.has(x)).length;
  return { total: new Set([...ind, ...claim]).size, both, indOnly: ind.size - both, claimOnly: claim.size - both, lb: get('lb').size, epoch: get('epoch').size, via: get('via').size };
}

// ---------------------------------------------------------------------------------------------------------------
// A model's place on the Epoch Capabilities Index the day it came out, against today.

const eciDated = memo(() =>
  models
    .filter((m) => m.released && eciByModel.has(m.id))
    .map((m) => ({ id: m.id, d: m.released!, e: eciByModel.get(m.id)!.eci }))
    .sort((a, b) => b.e - a.e),
);
/** Its rank among the models released by its release day, of how many, and its rank today, of how many. */
export function eciThenNow(id: string): { then: number; thenOf: number; now: number; nowOf: number } | undefined {
  const all = eciDated();
  const me = all.find((x) => x.id === id);
  if (!me) return undefined;
  const out = all.filter((x) => x.d <= me.d);
  return { then: out.findIndex((x) => x.id === id) + 1, thenOf: out.length, now: all.findIndex((x) => x.id === id) + 1, nowOf: all.length };
}

// ---------------------------------------------------------------------------------------------------------------
// A lab's share of number one: the contested benchmark-days it held at number one in each half year, over the
// benchmarks the Leaders page follows, as insights.ts leadTrend() counts them, with every lab kept apart.

export interface LabLead {
  periods: Period[];
  /** Contested days per half year. */
  days: number[];
  /** Share of each half year's contested days. */
  share: number[];
  /** Its place among labs each half year, 1 for the most days, 0 with no days. */
  place: number[];
  /** Benchmarks with contested days each half year. */
  benchmarks: number[];
  /** The benchmarks it leads today while the race is still on, and the model that leads each. */
  leads: { benchmark: string; model: string; since: string; value: number }[];
  /** The benchmarks the Leaders page follows. */
  followed: number;
  /** Of those, the ones whose race is still going today. */
  live: number;
  /** Contested days across every lab, each half year. */
  total: number[];
}

const leadIndex = memo(() => {
  const cats = AREAS.flatMap((a) => a.categories);
  const rows = [...new Map(cats.flatMap((c) => leaderRows(benchmarks.filter((b) => b.category === c).map((b) => b.id), 'headline')).map((r) => [r.benchmark, r])).values()];
  const periods = leadTrend().periods;
  const bounds = periods.map((p) => {
    const y = Number(p.key.slice(0, 4));
    return p.key.endsWith('H1') ? [`${y}-01-01`, `${y}-07-01`] : [`${y}-07-01`, `${y + 1}-01-01`];
  });
  const per = new Map<string, number[]>();
  const tot = periods.map(() => 0);
  const seen = periods.map(() => new Set<string>());
  for (const r of rows)
    for (const g of r.reigns)
      bounds.forEach(([a, b], i) => {
        const d = contestedDays(g, r, a) - contestedDays(g, r, b);
        if (d <= 0) return;
        const lab = g.lab ?? 'other';
        if (!per.has(lab)) per.set(lab, periods.map(() => 0));
        per.get(lab)![i] += d;
        tot[i] += d;
        seen[i].add(r.benchmark);
      });
  const leads = new Map<string, LabLead['leads']>();
  for (const r of rows) {
    const g = r.reigns.at(-1);
    if (!g?.lab || clockStop(r)) continue;
    push(leads, g.lab, { benchmark: r.benchmark, model: g.model, since: g.start, value: g.steps.at(-1)!.value });
  }
  return { periods, per, tot, seen, leads, followed: rows.length, live: rows.filter((r) => !clockStop(r)).length };
});

export function labLead(lab: string): LabLead | undefined {
  const x = leadIndex();
  const days = x.per.get(lab);
  if (!days) return undefined;
  const place = x.periods.map((_, i) => (days[i] > 0 ? 1 + [...x.per.entries()].filter(([l, v]) => l !== lab && l !== 'other' && v[i] > days[i]).length : 0));
  return {
    periods: x.periods,
    days,
    share: days.map((d, i) => (x.tot[i] ? d / x.tot[i] : 0)),
    place,
    benchmarks: x.seen.map((s) => s.size),
    leads: (x.leads.get(lab) ?? []).sort((a, b) => a.since.localeCompare(b.since)),
    followed: x.followed,
    live: x.live,
    total: x.tot,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// How often a lab releases models: the models we track, by the quarter they came out and by their weights.

export interface Quarter {
  key: string;
  /** "Q2 2025" */
  label: string;
  open: string[];
  closed: string[];
  /** Weights we haven't recorded. */
  unknown: string[];
  partial: boolean;
}
export const CADENCE_FROM = '2022';
const qKey = (d: string) => `${d.slice(0, 4)}-Q${Math.ceil(Number(d.slice(5, 7)) / 3)}`;

export function labCadence(lab: string): Quarter[] {
  const ms = models.filter((m) => m.lab === lab && /^\d{4}-\d\d/.test(m.released ?? '')).sort((a, b) => a.released!.localeCompare(b.released!));
  if (!ms.length) return [];
  const first = ms[0].released! < CADENCE_FROM ? `${CADENCE_FROM}-01` : ms[0].released!;
  const out: Quarter[] = [];
  const last = qKey(AS_OF);
  for (let y = Number(first.slice(0, 4)), q = Math.ceil(Number(first.slice(5, 7)) / 3); `${y}-Q${q}` <= last; q === 4 ? (y++, (q = 1)) : q++) {
    const key = `${y}-Q${q}`;
    const inQ = ms.filter((m) => qKey(m.released!) === key);
    out.push({
      key,
      label: `Q${q} ${y}`,
      open: inQ.filter((m) => m.weights === 'open').map((m) => m.name),
      closed: inQ.filter((m) => m.weights === 'closed').map((m) => m.name),
      unknown: inQ.filter((m) => !m.weights).map((m) => m.name),
      partial: key === last,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// The benchmarks a lab made, alone or with others, and how many releases from other labs named each.

const madeIndex = memo(() => {
  const by = new Map<string, string[]>();
  for (const b of benchmarks) for (const lab of new Set(makerParts(b.org ?? '').map((p) => p.lab).filter((l): l is string => !!l))) push(by, lab, b.id);
  return by;
});

export interface Made {
  s: BenchSummary;
  /** Releases from other labs that named it, in a launch post or the documents published with it. */
  others: number;
  otherLabs: string[];
  /** Releases from the lab itself that named it. */
  own: number;
}
export function labMade(lab: string): Made[] {
  return (madeIndex().get(lab) ?? [])
    .map((id) => {
      const s = benchSummary(id);
      const rel = new Map<string, string>();
      for (const c of [...s.cites, ...s.docCites]) rel.set(c.card.release ?? c.card.id, c.card.lab);
      const otherRel = [...rel.values()].filter((l) => l !== lab);
      return { s, others: otherRel.length, otherLabs: [...new Set(otherRel)], own: rel.size - otherRel.length };
    })
    .sort((a, b) => b.others - a.others || b.s.nScores - a.s.nScores || a.s.b.name.localeCompare(b.s.b.name));
}

// ---------------------------------------------------------------------------------------------------------------
// The benchmarks a lab carries (insights.ts carried()): named mostly in its releases since 2024.

export function labCarried(lab: string): Carried[] {
  return carried(false).list.filter((c) => c.labs[0].id === lab || (c.carriers === 2 && c.labs[1]?.id === lab));
}

// ---------------------------------------------------------------------------------------------------------------
// A lab's numbers next to independent runs of the same models (claims.ts).

const pairsByLab = memo(() => {
  const by = new Map<string, ClaimPair[]>();
  for (const p of claimPairs) {
    const lab = labOfPair(p);
    if (lab) push(by, lab, p);
  }
  return by;
});
export const labPairs = (lab: string) => pairsByLab().get(lab) ?? [];
export const allClaimStats = memo(() => claimStats(claimPairs));
export { claimStats };

/** The name of a lab, for captions. */
export const labName = (id: string | undefined) => (id ? (labById.get(id)?.name ?? id) : 'Other labs');

/**
 * A lab's color for a mark that has to stand apart from gray ones (wins against losses, a lab's own reign among
 * others): the lab's hue, or the ink color for a lab without one, whose gray would match the gray beside it.
 */
export const markColor = (lab: string | undefined) => (lab === 'xai' || LAB_SLOTS.includes(lab as (typeof LAB_SLOTS)[number]) ? labColor(lab) : 'var(--ink)');
