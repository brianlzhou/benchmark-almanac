// The trend series behind the Insights pages (/insights/ and its subpages): how launch posts, new benchmarks and
// the frontier have changed over time. Every series comes from the same data as the rest of the site. Each
// function caches its result, since the overview page and a subpage both ask for it in one build.

import { benchmarks, models, modelById, eciByModel, allSummaries, isPercent, AS_OF, SATURATED, labById } from './data.ts';
import { ARENA } from './time-machine.ts';
import { claimPairs } from './claims.ts';
import { makerParts, makerId } from './makers.ts';
import { makerKind, MAKER_KINDS, type MakerKind } from './maker-kinds.ts';
import { reportingData, FIRST_YEAR } from './reporting.ts';
import { FRONTIER } from './reporting-view.ts';
import { leaderRows } from './leaders.ts';
import { contestedDays } from './reigns.ts';
import { AREAS, areaOf } from './taxonomy.ts';
import { yearFrac } from './format.ts';

const DAY = 864e5;
const ms = (d: string) => Date.parse(d.length === 4 ? `${d}-07-01` : d.length === 7 ? `${d}-15` : d);
const monthsBetween = (a: string, b: string) => (ms(b) - ms(a)) / (30.44 * DAY);
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  if (!s.length) return NaN;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const memo = <T>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};
/** A cached function of one switch: every benchmark, or only the ones labs cite. */
const memoCited = <T>(f: (cited: boolean) => T) => {
  const v = new Map<boolean, T>();
  return (cited = false) => {
    if (!v.has(cited)) v.set(cited, f(cited));
    return v.get(cited)!;
  };
};
/** Benchmarks named in at least one lab's launch post: the "Only benchmarks labs cite" switch on /insights/evals/. */
export const citedIds = memo(() => new Set(allSummaries().filter((s) => s.cites.length > 0).map((s) => s.b.id)));
/** "42%" */
export const pct = (v: number) => `${Math.round(100 * v)}%`;
const word = (n: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);

// ---------------------------------------------------------------------------------------------------------------
// Periods. A half year ("2024-H1") or a year ("2024") sits on a time axis at its middle. The current one, which has
// not ended, sits at the middle of the part that has passed.

export interface Period {
  key: string;
  /** Where it sits on a time axis, in decimal years. */
  x: number;
  /** The words for it in a sentence: "the first half of 2024", "2026 so far". */
  name: string;
  /** Not over yet. */
  partial: boolean;
}
const asOfX = yearFrac(AS_OF);
const halfKey = (d: string) => `${d.slice(0, 4)}-H${Number(d.slice(5, 7)) <= 6 ? 1 : 2}`;
function halves(from: string): Period[] {
  const out: Period[] = [];
  const last = halfKey(AS_OF);
  for (let y = Number(from.slice(0, 4)), h = from.endsWith('H2') ? 2 : 1; `${y}-H${h}` <= last; h === 2 ? (y++, (h = 1)) : (h = 2)) {
    const key = `${y}-H${h}`;
    const start = y + (h - 1) / 2;
    const partial = key === last;
    const x = partial ? (start + asOfX) / 2 : start + 0.25;
    const base = `the ${h === 1 ? 'first' : 'second'} half of ${y}`;
    out.push({ key, x, name: partial ? `${base} so far` : base, partial });
  }
  return out;
}
function years(from: number): Period[] {
  const out: Period[] = [];
  const last = Number(AS_OF.slice(0, 4));
  for (let y = from; y <= last; y++) {
    const partial = y === last;
    out.push({ key: String(y), x: partial ? (y + asOfX) / 2 : y + 0.5, name: partial ? `${y} so far` : String(y), partial });
  }
  return out;
}

/** One value of a series, with the counts behind it for the hover. */
export interface Val {
  v: number | null;
  /** How many it counts, and of how many: "31 of 49". */
  of?: [number, number];
}

// ---------------------------------------------------------------------------------------------------------------
// Model card reporting: the benchmarks each release names (src/lib/reporting.ts), per half year since 2024.

export interface ReportingTrend {
  periods: Period[];
  releases: number[];
  /** Mentions of a benchmark that came out in the year before the release. */
  fresh: Val[];
  /** Mentions that went to the half year's ten most-named benchmark families. */
  topTen: Val[];
  /** Mentions of a benchmark the releasing lab made itself. */
  own: Val[];
  /** The median number of benchmarks a release names. */
  perRelease: Val[];
}

function reportingTrendOf(frontier: boolean, safety: boolean, models: boolean): ReportingTrend {
  const d = reportingData();
  const periods = halves(`${FIRST_YEAR}-H1`);
  const at = new Map(periods.map((p, i) => [p.key, i]));
  const n = periods.length;
  const releases = new Array(n).fill(0);
  const fresh = periods.map(() => [0, 0]);
  const own = periods.map(() => [0, 0]);
  const fams = periods.map(() => new Map<string, number>());
  const sizes: number[][] = periods.map(() => []);
  const released = new Map(benchmarks.map((b) => [b.id, b.released]));
  for (const rel of d.rels) {
    const i = at.get(halfKey(rel.date));
    if (i === undefined) continue;
    const labId = d.labs[rel.lab].id;
    if (frontier && !FRONTIER.has(labId)) continue;
    if (models && !rel.f) continue;
    const named = rel.r.map(([bi]) => d.benches[bi]).filter((b) => safety || !b.safety);
    if (!named.length) continue;
    releases[i]++;
    sizes[i].push(named.length);
    for (const b of new Set(named.map((b) => b.fam))) fams[i].set(b, (fams[i].get(b) ?? 0) + 1);
    for (const b of named) {
      const r = released.get(b.id);
      if (r && /^\d{4}-\d\d/.test(r)) {
        fresh[i][1]++;
        if (monthsBetween(r, rel.date) <= 12) fresh[i][0]++;
      }
      own[i][1]++;
      if (b.makers.includes(labId)) own[i][0]++;
    }
  }
  const share = ([k, t]: number[]): Val => ({ v: t ? k / t : null, of: [k, t] });
  const topTen = fams.map((m): Val => {
    const all = [...m.values()].sort((a, b) => b - a);
    const tot = all.reduce((a, b) => a + b, 0);
    const top = all.slice(0, 10).reduce((a, b) => a + b, 0);
    return { v: tot ? top / tot : null, of: [top, tot] };
  });
  return {
    periods,
    releases,
    fresh: fresh.map(share),
    topTen,
    own: own.map(share),
    perRelease: sizes.map((s): Val => ({ v: s.length ? median(s) : null, of: [s.length, s.length] })),
  };
}
const reportingCache = new Map<string, ReportingTrend>();
/** The reporting trend for every lab or the frontier labs, every release or frontier models, with or without safety evaluations. */
export function reportingTrend(frontier = false, safety = false, models = false): ReportingTrend {
  const k = `${+frontier}${+safety}${+models}`;
  if (!reportingCache.has(k)) reportingCache.set(k, reportingTrendOf(frontier, safety, models));
  return reportingCache.get(k)!;
}

// ---------------------------------------------------------------------------------------------------------------
// New benchmarks: how the benchmarks that came out each year were built, from the catalog's own fields.

export const EVAL_FROM = 2020;
export interface EvalTrend {
  periods: Period[];
  /** Benchmarks in the catalog that came out each year. */
  count: number[];
  agent: Val[];
  choice: Val[];
  judged: Val[];
  hidden: Val[];
}
export const evalTrend = memoCited((cited): EvalTrend => {
  const periods = years(EVAL_FROM);
  const at = new Map(periods.map((p, i) => [p.key, i]));
  const count = periods.map(() => 0);
  const tally = () => periods.map(() => [0, 0]);
  const agent = tally();
  const choice = tally();
  const judged = tally();
  const hidden = tally();
  for (const b of benchmarks) {
    const i = at.get((b.released ?? '').slice(0, 4));
    if (i === undefined || (cited && !citedIds().has(b.id))) continue;
    count[i]++;
    if (b.format) {
      agent[i][1]++;
      choice[i][1]++;
      if (b.format === 'agent-task') agent[i][0]++;
      if (b.format === 'multiple-choice') choice[i][0]++;
    }
    if (b.scoring && b.scoring !== 'none') {
      judged[i][1]++;
      if (b.scoring === 'model-judged') judged[i][0]++;
    }
    if (b.access && b.access !== 'unknown') {
      hidden[i][1]++;
      if (b.access.includes('private')) hidden[i][0]++;
    }
  }
  const share = ([k, t]: number[]): Val => ({ v: t ? k / t : null, of: [k, t] });
  return { periods, count, agent: agent.map(share), choice: choice.map(share), judged: judged.map(share), hidden: hidden.map(share) };
});

// ---------------------------------------------------------------------------------------------------------------
// Saturation: for benchmarks that came out in each year, the share whose best score had passed 85% so many months
// after release. Benchmarks are of different ages, so the share is a survival estimate (Kaplan-Meier): each month,
// of the benchmarks old enough to have lived through it and not yet past 85%, the part that passed. A curve stops
// when fewer than SAT_MIN_LEFT benchmarks are still followed.

export const SAT_MONTHS = 36;
export const SAT_MIN_SCORES = 5;
const SAT_MIN_LEFT = 15;
export interface Cohort {
  year: string;
  /** Benchmarks followed. */
  n: number;
  /** Estimated share past 85% at each month since release, 0 to SAT_MONTHS, null where the curve has stopped. */
  share: (number | null)[];
  /** Past 85% the day they came out: models released before the benchmark already scored that high. */
  atRelease: number;
}
export const saturationCohorts = memoCited((cited): Cohort[] => {
  const groups = new Map<string, { age: number; sat: number | null }[]>();
  for (const s of allSummaries()) {
    const b = s.b;
    if (!b.released || !/^\d{4}-\d\d/.test(b.released) || !isPercent(b.unit) || b.better === 'lower') continue;
    if (areaOf(b.category) === 'safety' || s.nScores < SAT_MIN_SCORES || (cited && !s.cites.length)) continue;
    const y = b.released.slice(0, 4);
    if (y < '2023') continue;
    const age = monthsBetween(b.released, AS_OF);
    // a score dated before the benchmark came out (models are dated by release) counts as passing on day one
    const sat = s.saturatedAt ? Math.max(0, monthsBetween(b.released, s.saturatedAt)) : null;
    groups.set(y, [...(groups.get(y) ?? []), { age, sat: sat !== null && sat <= age ? sat : sat === null ? null : age }]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, xs]) => {
      const atRelease = xs.filter((x) => x.sat !== null && x.sat < 0.5).length;
      const share: (number | null)[] = [atRelease / xs.length];
      let alive = 1 - share[0]!;
      for (let m = 1; m <= SAT_MONTHS; m++) {
        // still followed through month m: not past 85% by its start, and old enough to have reached it
        const atRisk = xs.filter((x) => (x.sat === null || x.sat >= m - 0.5) && x.age >= m - 0.5 && !(x.sat !== null && x.sat < 0.5));
        if (atRisk.length < SAT_MIN_LEFT) {
          share.push(null);
          continue;
        }
        const passed = atRisk.filter((x) => x.sat !== null && x.sat < m + 0.5).length;
        alive *= 1 - passed / atRisk.length;
        share.push(1 - alive);
      }
      return { year, n: xs.length, share, atRelease };
    })
    .filter((c) => c.n >= 20);
});

// ---------------------------------------------------------------------------------------------------------------
// Open and closed weights: the best capabilities index score (Epoch AI) of any model released by each month's end.

export interface GapPoint {
  date: string;
  x: number;
  closed: number;
  open: number;
  /** Months since a closed model first reached the open models' best. */
  lag: number;
  /** The models that held each best. */
  closedModel: string;
  openModel: string;
}
export const openGap = memo((): GapPoint[] => {
  const pts = models
    .filter((m) => m.released && eciByModel.has(m.id) && (m.weights === 'open' || m.weights === 'closed'))
    .map((m) => ({ id: m.id, name: m.name, d: m.released!, eci: eciByModel.get(m.id)!.eci, open: m.weights === 'open' }))
    .sort((a, b) => a.d.localeCompare(b.d));
  const out: GapPoint[] = [];
  for (let y = 2023, mo = 1; ; mo === 12 ? (y++, (mo = 1)) : mo++) {
    const end = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
    const date = end > AS_OF ? AS_OF : end;
    const upTo = pts.filter((p) => p.d <= date);
    const bestOf = (open: boolean) => upTo.filter((p) => p.open === open).sort((a, b) => b.eci - a.eci)[0];
    const c = bestOf(false);
    const o = bestOf(true);
    if (c && o) {
      const caught = pts.find((p) => !p.open && p.eci >= o.eci)!;
      out.push({ date, x: yearFrac(date), closed: c.eci, open: o.eci, lag: Math.max(0, monthsBetween(caught.d, date)), closedModel: c.name, openModel: o.name });
    }
    if (date === AS_OF) break;
  }
  return out;
});

// ---------------------------------------------------------------------------------------------------------------
// Who held number one: each lab's share of the contested benchmark-days in each half year, over the benchmarks the
// Leaders page follows (src/lib/leaders.ts), from the source each benchmark's page leads with.

export const LEAD_FROM = '2024-H1';
export interface LeadTrend {
  periods: Period[];
  /** Labs in stack order, the most days first. */
  labs: { id: string; name: string }[];
  /** Share of each half year's contested days, per lab, in `labs` order. */
  shares: number[][];
  /** Benchmarks with contested days in each half year. */
  benchmarks: number[];
}
export const leadTrend = memo((): LeadTrend => {
  const cats = AREAS.flatMap((a) => a.categories);
  const rows = [...new Map(cats.flatMap((c) => leaderRows(benchmarks.filter((b) => b.category === c).map((b) => b.id), 'headline')).map((r) => [r.benchmark, r])).values()];
  const periods = halves(LEAD_FROM);
  const bounds = periods.map((p) => {
    const y = Number(p.key.slice(0, 4));
    return p.key.endsWith('H1') ? [`${y}-01-01`, `${y}-07-01`] : [`${y}-07-01`, `${y + 1}-01-01`];
  });
  const perLab = new Map<string, number[]>();
  const tot = periods.map(() => 0);
  const seen = periods.map(() => new Set<string>());
  for (const r of rows)
    for (const g of r.reigns)
      bounds.forEach(([a, b], i) => {
        // contested days inside the half year: those counted from its start, less those counted from its end
        const d = contestedDays(g, r, a) - contestedDays(g, r, b);
        if (d <= 0) return;
        const lab = g.lab && labById.has(g.lab) ? g.lab : 'other';
        if (!perLab.has(lab)) perLab.set(lab, periods.map(() => 0));
        perLab.get(lab)![i] += d;
        tot[i] += d;
        seen[i].add(r.benchmark);
      });
  // the labs that ever held a tenth of a half year keep their own band, the rest join "Other labs"
  const keep = [...perLab.entries()].filter(([lab, v]) => lab !== 'other' && v.some((d, i) => tot[i] && d / tot[i] >= 0.1));
  keep.sort((a, b) => b[1].reduce((x, y) => x + y, 0) - a[1].reduce((x, y) => x + y, 0));
  const other = periods.map((_, i) => tot[i] - keep.reduce((s, [, v]) => s + v[i], 0));
  const labs = [...keep.map(([id]) => ({ id, name: labById.get(id)?.name ?? id })), { id: 'other', name: 'Other labs' }];
  const shares = [...keep.map(([, v]) => v), other].map((v) => v.map((d, i) => (tot[i] ? d / tot[i] : 0)));
  return { periods, labs, shares, benchmarks: seen.map((s) => s.size) };
});

// ---------------------------------------------------------------------------------------------------------------
// Arena's number one: each model that topped Arena's text leaderboard (style control), from its daily snapshots
// on Hugging Face (data/scores/arena-history.json), and how long it stayed there.

export interface ArenaReign {
  name: string;
  lab: string;
  start: string;
  /** The day the next model took over, or the data's last day for the one on top now. */
  end: string;
  days: number;
  current: boolean;
}
export const ARENA_FROM = () => ARENA.snapshots[0].date;
export const arenaReigns = memo((): ArenaReign[] => {
  const out: ArenaReign[] = [];
  for (const snap of ARENA.snapshots) {
    const top = snap.rows.find((r) => r[4] === 1) ?? snap.rows[0];
    const [raw, model, lab] = top as unknown as [string, string | null, string];
    const name = (model && modelById.get(model)?.name) || raw;
    if (out.at(-1)?.name === name) continue;
    if (out.length) out.at(-1)!.end = snap.date;
    out.push({ name, lab, start: snap.date, end: AS_OF, days: 0, current: false });
  }
  for (const r of out) r.days = Math.max(1, Math.round((Date.parse(r.end) - Date.parse(r.start)) / DAY));
  out.at(-1)!.current = true;
  return out;
});
/** Per year: how many models took the top spot, and the median days they held it (a reign counts in the year it began). */
export function arenaYears(rs = arenaReigns()) {
  const years = [...new Set(rs.map((r) => r.start.slice(0, 4)))];
  return years.map((y) => {
    const xs = rs.filter((r) => r.start.startsWith(y));
    return { year: y, partial: y === ARENA_FROM().slice(0, 4) || y === AS_OF.slice(0, 4), count: xs.length, median: median(xs.map((r) => r.days)) };
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Saturation by area: at the end of each half year, the share of each area's benchmarks with a score past 85%,
// among percentage benchmarks with at least three scores and a first score by then.

export const AREA_SAT_FROM = '2023-H2';
export interface AreaSat {
  periods: Period[];
  areas: { id: string; name: string; vals: Val[] }[];
}
export const areaSaturation = memoCited((cited): AreaSat => {
  const periods = halves(AREA_SAT_FROM);
  const endOf = (p: Period) => (p.partial ? AS_OF : p.key.endsWith('H1') ? `${p.key.slice(0, 4)}-06-30` : `${p.key.slice(0, 4)}-12-31`);
  const xs = allSummaries().filter((s) => isPercent(s.b.unit) && s.b.better !== 'lower' && s.nScores >= 3 && s.frontier.length && (!cited || s.cites.length > 0));
  const areas = AREAS.filter((a) => a.id !== 'other').map((a) => {
    const mine = xs.filter((s) => areaOf(s.b.category) === a.id);
    const vals = periods.map((p): Val => {
      const e = endOf(p);
      const live = mine.filter((s) => s.frontier[0].date <= e);
      const sat = live.filter((s) => s.saturatedAt && s.saturatedAt <= e).length;
      return { v: live.length >= (cited ? 5 : 10) ? sat / live.length : null, of: [sat, live.length] };
    });
    return { id: a.id, name: a.name, vals };
  });
  return { periods, areas };
});

// ---------------------------------------------------------------------------------------------------------------
// Who makes new benchmarks: for the benchmarks that came out each year, the share made with at least one maker of
// each kind (src/lib/maker-kinds.ts). A benchmark made by a lab and a university counts in both, so the shares add
// up to more than 100%. Benchmarks whose makers are all unclassified count in the total.

export interface MakerTrend {
  periods: Period[];
  kinds: { id: MakerKind; name: string; note: string; vals: Val[] }[];
  /** Benchmarks each year whose makers are all unclassified. */
  unclassified: Val[];
}
export const makerTrend = memoCited((cited): MakerTrend => {
  const periods = years(EVAL_FROM);
  const at = new Map(periods.map((p, i) => [p.key, i]));
  const tot = periods.map(() => 0);
  const per = new Map<MakerKind, number[]>(MAKER_KINDS.map((k) => [k.id, periods.map(() => 0)]));
  const none = periods.map(() => 0);
  for (const b of benchmarks) {
    const i = at.get((b.released ?? '').slice(0, 4));
    if (i === undefined || (cited && !citedIds().has(b.id))) continue;
    const ks = new Set<MakerKind>();
    for (const p of makerParts(b.org ?? '')) {
      const id = makerId(p.text);
      if (id) ks.add(makerKind(id, p.text, p.lab, p.lab ? labById.get(p.lab)?.name : undefined));
    }
    if (!ks.size) continue;
    tot[i]++;
    for (const k of ks) {
      const row = per.get(k);
      if (row) row[i]++;
    }
    if (ks.size === 1 && ks.has('unclassified')) none[i]++;
  }
  const share = (v: number[]) => v.map((k, i): Val => ({ v: tot[i] ? k / tot[i] : null, of: [k, tot[i]] }));
  return { periods, kinds: MAKER_KINDS.map((k) => ({ ...k, vals: share(per.get(k.id)!) })), unclassified: share(none) };
});

// ---------------------------------------------------------------------------------------------------------------
// Lab numbers against independent runs: for each year of the lab's document, of the percentage pairs where the two
// differ (src/lib/claims.ts), the share where the lab's number is better, and the median gap in points.

export const CLAIMS_FROM = 2024;
export interface ClaimTrend {
  periods: Period[];
  labBetter: Val[];
  gap: Val[];
}
export const claimTrend = memo((): ClaimTrend => {
  const periods = years(CLAIMS_FROM);
  const at = new Map(periods.map((p, i) => [p.key, i]));
  const gaps: number[][] = periods.map(() => []);
  for (const p of claimPairs) {
    const i = at.get(p.claim.card.date.slice(0, 4));
    if (i === undefined || p.same || p.unit !== '%') continue;
    gaps[i].push(p.gap);
  }
  return {
    periods,
    labBetter: gaps.map((g): Val => ({ v: g.length ? g.filter((x) => x > 0).length / g.length : null, of: [g.filter((x) => x > 0).length, g.length] })),
    gap: gaps.map((g): Val => ({ v: g.length ? median(g) : null, of: [g.length, g.length] })),
  };
});

/** New records on the capabilities index each year: a model that scored above every model released before it. */
export const eciRecords = memo(() => {
  const pts = models
    .filter((m) => m.released && eciByModel.has(m.id))
    .map((m) => ({ name: m.name, lab: m.lab, d: m.released!, e: eciByModel.get(m.id)!.eci }))
    .sort((a, b) => a.d.localeCompare(b.d) || b.e - a.e);
  let best = -Infinity;
  const recs: typeof pts = [];
  for (const p of pts) if (p.e > best) (best = p.e), recs.push(p);
  return recs;
});

// ---------------------------------------------------------------------------------------------------------------
// Benchmarks one or two labs carry: of the benchmark families named in at least CARRY_MIN releases since 2024, the
// ones where one lab accounts for at least half the releases naming them, or the top two labs for four in five.

export const CARRY_MIN = 5;
export interface Carried {
  fam: string;
  name: string;
  href: string;
  releases: number;
  /** Labs that named it, most releases first. */
  labs: { id: string; name: string; n: number }[];
  carriers: 1 | 2;
  /** The top lab made the benchmark itself. */
  own: boolean;
}
export interface CarryStats {
  /** Families named in at least CARRY_MIN releases. */
  total: number;
  list: Carried[];
}
const carryCache = new Map<boolean, CarryStats>();
export function carried(safety = false): CarryStats {
  if (carryCache.has(safety)) return carryCache.get(safety)!;
  const d = reportingData();
  const by = new Map<string, { name: string; id: string; makers: Set<string>; rels: number; labs: Map<string, number> }>();
  for (const rel of d.rels) {
    if (rel.date < `${FIRST_YEAR}`) continue;
    const labId = d.labs[rel.lab].id;
    const seen = new Set<string>();
    for (const [bi] of rel.r) {
      const b = d.benches[bi];
      if ((!safety && b.safety) || seen.has(b.fam)) continue;
      seen.add(b.fam);
      const e = by.get(b.fam) ?? { name: b.famName, id: b.id, makers: new Set<string>(), rels: 0, labs: new Map<string, number>() };
      for (const m of b.makers) e.makers.add(m);
      e.rels++;
      e.labs.set(labId, (e.labs.get(labId) ?? 0) + 1);
      by.set(b.fam, e);
    }
  }
  const eligible = [...by.entries()].filter(([, e]) => e.rels >= CARRY_MIN);
  const list: Carried[] = [];
  for (const [fam, e] of eligible) {
    const labs = [...e.labs.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, name: labById.get(id)?.name ?? id, n }));
    const one = labs[0].n / e.rels >= 0.5;
    const two = labs.length > 1 && (labs[0].n + labs[1].n) / e.rels >= 0.8;
    if (!one && !two) continue;
    list.push({ fam, name: e.name, href: `/benchmarks/${e.id}/`, releases: e.rels, labs, carriers: one ? 1 : 2, own: e.makers.has(labs[0].id) });
  }
  list.sort((a, b) => b.releases - a.releases || a.name.localeCompare(b.name));
  const out = { total: eligible.length, list };
  carryCache.set(safety, out);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// The findings each page leads with, in words, computed from the series above.

const firstFull = <T extends { v: number | null }>(vals: T[], periods: Period[]) => vals.findIndex((v, i) => v.v !== null && !periods[i].partial);

export function reportingFinding(t = reportingTrend()): string {
  const a = firstFull(t.fresh, t.periods);
  const b = t.fresh.length - 1;
  return `In ${t.periods[a].name}, ${pct(t.fresh[a].v!)} of the benchmarks labs named had come out in the year before the release. In ${t.periods[b].name}, ${pct(t.fresh[b].v!)} had.`;
}

export function evalFinding(t = evalTrend()): string {
  const a = t.periods.findIndex((p) => p.key === '2023');
  const b = t.periods.length - 1;
  return `Agent tasks made up ${pct(t.agent[a].v!)} of the new benchmarks in 2023 and ${pct(t.agent[b].v!)} in ${t.periods[b].key}. Multiple-choice tests fell from ${pct(t.choice[a].v!)} to ${pct(t.choice[b].v!)}.`;
}

/** The latest month since release, up to a year, that every cohort's curve reaches. */
export function satCompareMonth(cs = saturationCohorts()): number {
  let m = 12;
  while (m > 1 && cs.some((c) => c.share[m] == null)) m--;
  return m;
}

export function saturationFinding(cs = saturationCohorts()): string {
  if (cs.length < 2) return '';
  const m = satCompareMonth(cs);
  const [a, b] = [cs[0], cs.at(-1)!];
  const when = m === 12 ? 'A year' : `${word(m).replace(/^./, (c) => c.toUpperCase())} months`;
  return `${when} after release, ${pct(a.share[m]!)} of the benchmarks from ${a.year} had a score past ${SATURATED}%. Of those from ${b.year}, ${pct(b.share[m]!)} did.`;
}

export function gapFinding(g = openGap()): string {
  const now = g.at(-1)!;
  const mo = Math.round(now.lag);
  const avg = Math.round(median(g.filter((p) => p.date >= '2024-01-01').map((p) => p.lag)));
  return `The best open model today, ${now.openModel}, scores what the best closed model scored ${word(mo)} months ago. Since 2024 the median gap has been ${word(avg)} months.`;
}

export function leadFinding(t = leadTrend()): string {
  const n = t.periods.length;
  const topOf = (i: number) => t.labs.map((l, k) => ({ l, s: t.shares[k][i] })).filter((x) => x.l.id !== 'other').sort((a, b) => b.s - a.s)[0];
  const now = topOf(n - 1);
  // how many half years in a row before this one the same lab was first
  let run = 0;
  const prev = topOf(n - 2);
  for (let i = n - 2; i >= 0 && topOf(i).l.id === prev.l.id; i--) run++;
  const since = t.periods[n - 1 - run].name;
  if (now.l.id === prev.l.id) return `${now.l.name} has held number one on the most benchmark-days in every half year since ${since}, ${pct(now.s)} of them in ${t.periods[n - 1].name}.`;
  return `${now.l.name} held number one on ${pct(now.s)} of contested benchmark-days in ${t.periods[n - 1].name}. ${prev.l.name} had the most in every half year from ${since} until then.`;
}

// ---------------------------------------------------------------------------------------------------------------
// Chart helpers: the shapes src/components/insights/TrendChart.astro draws.

export interface TPoint {
  x: number;
  y: number | null;
  tv?: string;
  tn?: string;
  ts?: string;
  /** Covers a period that has not ended. */
  partial?: boolean;
}
export interface TSeries {
  key: string;
  label: string;
  color: string;
  pts: TPoint[];
  /** Hold each value until the next one (a best-so-far line). */
  step?: boolean;
}
export const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** A time axis from January 1 of `from` to today, labeled on each January 1. */
export function timeAxis(from: number) {
  const ticks: { v: number; label: string }[] = [];
  for (let y = from; y <= Math.floor(asOfX); y++) ticks.push({ v: y, label: String(y) });
  return { min: from, max: asOfX + 0.04, ticks };
}

/** A series of shares (0 to 1) drawn in percent, or of plain values, with each point's tooltip. */
export function trendSeries(o: {
  key: string;
  label: string;
  color: string;
  periods: Period[];
  vals: Val[];
  share?: boolean;
  /** The quieter line of each point's tooltip. */
  detail: (v: Val, i: number) => string | undefined;
}): TSeries {
  return {
    key: o.key,
    label: o.label,
    color: o.color,
    pts: o.periods.map((p, i) => {
      const v = o.vals[i].v;
      return {
        x: p.x,
        y: v === null ? null : o.share ? 100 * v : v,
        tv: v === null ? undefined : o.share ? pct(v) : String(Math.round(v * 10) / 10),
        tn: cap(p.name),
        ts: o.detail(o.vals[i], i),
        partial: p.partial,
      };
    }),
  };
}
