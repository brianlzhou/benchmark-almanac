// The time machine's payload: everything the page needs to draw any day from the start to today, kept small. Counts,
// the capabilities index, Arena's leaderboard and launch posts go in with their exact days. The slower parts (which
// benchmarks were the most cited, and how many were past 85%) are worked out for the first of each month.
// /time-machine.json serves it, and the page renders its default day from it on the server.
import arenaJson from '../../data/scores/arena-history.json';
import { benchmarks, benchById, models, modelById, labs, labById, cards, eciByModel, benchSummary, AS_OF } from './data.ts';
import { benchOpens, closedBy, historyOf } from './as-of.ts';
import { sourceName } from './pools.ts';
import { reignRow } from './reigns.ts';
import { mostReportedRows } from './leaders.ts';
import { RANKED_BY_PEOPLE_OR_MATCHES } from './taxonomy.ts';
import { COLOR_MARKS, MONO_MARKS } from './marks.ts';
import { labColor } from './palette.ts';
import { featuredIds } from './routes.ts';
import type { Payload, WatchFile } from './time-machine-view.ts';

/** The control starts here: the year the reign charts and lab credit count from. */
export const START = '2023-01-01';
/** The page opens on the same day a year before the data's last day (February 28 for a February 29). */
export const DEFAULT_DAY = (() => {
  const [y, m, d] = AS_OF.split('-').map(Number);
  const t = new Date(Date.UTC(y - 1, m - 1, d));
  return (t.getUTCMonth() === m - 1 ? t : new Date(Date.UTC(y - 1, m, 0))).toISOString().slice(0, 10);
})();

interface ArenaHistory {
  source: string;
  url: string;
  license: string;
  retrieved: string;
  snapshots: { date: string; rows: [string, string | null, string | null, number, number][] }[];
}
export const ARENA = arenaJson as unknown as ArenaHistory;

/** The first of each month from START to the data's last day, and the last day itself. */
export function monthStarts(): string[] {
  const out: string[] = [];
  let [y, m] = START.split('-').map(Number);
  for (;;) {
    const d = `${y}-${String(m).padStart(2, '0')}-01`;
    if (d > AS_OF) break;
    out.push(d);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  if (out.at(-1) !== AS_OF) out.push(AS_OF);
  return out;
}

/**
 * The benchmarks the share-past-85% chart counts: percentage scores where higher is better, at least three scores
 * from the source the page leads with (a reign row), and not a vote or match ranking or a safety eval, whose scores
 * past 85% mean something else.
 */
function saturationRows() {
  return benchmarks
    .filter((b) => (b.unit ?? '%') === '%' && b.better !== 'lower' && b.category !== 'safety-alignment' && !RANKED_BY_PEOPLE_OR_MATCHES.has(b.scoring ?? ''))
    .map((b) => ({ b, row: reignRow(b.id, 'headline') }))
    .filter((x) => x.row && x.row.unit === '%' && x.row.reigns.length);
}

/** The first day a launch post featured each benchmark. */
function firstFeatured(): Map<string, string> {
  const first = new Map<string, string>();
  for (const c of cards) for (const r of c.results) if (!first.has(r.benchmark) || c.date < first.get(r.benchmark)!) first.set(r.benchmark, c.date);
  return first;
}

// ---- a benchmark to watch ------------------------------------------------------------------------------
let watchCache: Map<string, ReturnType<typeof historyOf>> | null = null;
/** Every benchmark whose board has a score on a tracked model, with those scores and the day each became known. */
export function watchable(): Map<string, ReturnType<typeof historyOf>> {
  if (watchCache) return watchCache;
  watchCache = new Map();
  for (const b of benchmarks) {
    const h = historyOf(b.id);
    if (h.length) watchCache.set(b.id, h);
  }
  return watchCache;
}

const markKind = (lab: string) => (COLOR_MARKS.has(lab) ? 'c' : MONO_MARKS.has(lab) ? 'm' : '');

/** One benchmark's file for the watch column (/time-machine/b/<id>.json). */
export function watchFile(id: string): WatchFile | null {
  const h = watchable().get(id);
  const b = benchById.get(id);
  if (!h || !b) return null;
  const labIds = new Set<string>();
  const rows: WatchFile['rows'] = h.map(({ score, known }) => {
    const m = modelById.get(score.model);
    if (m?.lab) labIds.add(m.lab);
    return [score.model, m?.name ?? score.model, m?.lab ?? '', Math.round(score.value * 100) / 100, known, featuredIds.has(score.model) ? 1 : 0];
  });
  const s = benchSummary(id);
  return {
    v: 1,
    id,
    name: b.name,
    unit: b.unit ?? '%',
    better: b.better === 'lower' ? 'lower' : 'higher',
    source: sourceName(s.boardSource, s),
    labs: Object.fromEntries([...labIds].map((l) => [l, [labById.get(l)?.name ?? l, markKind(l), labColor(l)]])),
    rows,
  };
}

let cached: Payload | null = null;

export function timeMachinePayload(): Payload {
  if (cached) return cached;
  const days = monthStarts();

  // models the page names: the index, leaders, launch posts and Arena rows we can place
  const used = new Set<string>();
  const eciModels = models.filter((m) => m.released && eciByModel.has(m.id));
  for (const m of eciModels) used.add(m.id);

  // one row per family: its newest version that enough releases reported that year and that has a leader
  const cited: Payload['cited'] = days.map((d) => {
    const picked = mostReportedRows(d);
    const led = new Set(picked.headline.map((r) => r.benchmark));
    return [d, picked.tests.map((t) => t.ids.filter((id) => led.has(id)).at(-1)).filter((id): id is string => !!id)];
  });
  const citedIds = [...new Set(cited.flatMap((c) => c[1]))];
  const reignsOf = new Map(citedIds.map((id) => [id, reignRow(id, 'headline')]));
  for (const r of reignsOf.values()) for (const g of r?.reigns ?? []) used.add(g.model);

  const posts = cards.filter((c) => c.date >= '2022-10-01' && c.date <= AS_OF && modelById.has(c.model));
  for (const c of posts) used.add(c.model);
  for (const s of ARENA.snapshots) for (const r of s.rows.slice(0, 10)) if (r[1] && modelById.has(r[1])) used.add(r[1]);

  const list = models.filter((m) => used.has(m.id)).sort((a, b) => a.id.localeCompare(b.id));
  const mi = new Map(list.map((m, i) => [m.id, i]));
  const labIds = new Set<string>([...list.map((m) => m.lab ?? ''), ...ARENA.snapshots.flatMap((s) => s.rows.slice(0, 10).map((r) => r[2] ?? ''))].filter(Boolean));
  const labMap: Payload['labs'] = {};
  for (const l of labs) if (labIds.has(l.id)) labMap[l.id] = [l.name, COLOR_MARKS.has(l.id) ? 'c' : MONO_MARKS.has(l.id) ? 'm' : '', labColor(l.id)];

  // benchmarks opened by the first of each month: every record, versions included, like the site's counts
  const opens = benchmarks.map((b) => benchOpens(b)).filter((d): d is string => !!d).sort();
  let k = 0;
  const benchMonths: Payload['benchMonths'] = [];
  for (const d of days) {
    while (k < opens.length && opens[k] <= d) k++;
    benchMonths.push([d, k]);
  }

  // the share past 85%, for all benchmarks with scores and for those a launch post had featured by then
  const sat = saturationRows();
  const featured = firstFeatured();
  const share: Payload['share'] = days.map((d) => {
    let past = 0;
    let total = 0;
    let fPast = 0;
    let fTotal = 0;
    for (const { b, row } of sat) {
      if (row!.reigns[0].start > d) continue;
      const done = closedBy(row, d) ? 1 : 0;
      total++;
      past += done;
      if ((featured.get(b.id) ?? '9999') <= d) {
        fTotal++;
        fPast += done;
      }
    }
    return [d, past, total, fPast, fTotal];
  });

  // Arena's names repeat from one published day to the next, so each is stored once
  const arenaNames = [...new Set(ARENA.snapshots.flatMap((s) => s.rows.slice(0, 10).map((r) => r[0])))];
  const nameIndex = new Map(arenaNames.map((x, i) => [x, i]));
  const r1 = (v: number) => Math.round(v * 10) / 10;
  cached = {
    v: 1,
    start: START,
    end: AS_OF,
    def: DEFAULT_DAY,
    labs: labMap,
    models: list.map((m) => [m.id, m.name, m.lab ?? '', m.released ?? '', featuredIds.has(m.id) ? 1 : 0]),
    eci: eciModels.map((m) => [mi.get(m.id)!, r1(eciByModel.get(m.id)!.eci)]),
    modelDays: models.map((m) => m.released).filter((d): d is string => !!d).sort(),
    benchMonths,
    benches: Object.fromEntries(citedIds.map((id) => [id, [benchById.get(id)?.name ?? id, benchById.get(id)?.unit ?? '%']])),
    reigns: Object.fromEntries(
      citedIds.map((id) => [id, (reignsOf.get(id)?.reigns ?? []).map((g) => [g.start, mi.get(g.model)!, g.steps.map((s) => [s.date, r1(s.value)] as [string, number])] as [string, number, [string, number][]])]),
    ),
    cited,
    posts: posts.map((c) => [c.date, mi.get(c.model)!, c.lab, c.url ?? '']),
    arenaNames,
    arena: ARENA.snapshots.map((s) => [s.date, s.rows.slice(0, 10).map((r) => [nameIndex.get(r[0])!, r[1] && mi.has(r[1]) ? mi.get(r[1])! : -1, r[2] ?? '', r[3]] as [number, number, string, number])]),
    share,
    // the benchmarks the watch column can find: [id, name, other names, models scored], most-scored first
    watch: [...watchable()]
      .map(([id, h]) => [id, benchById.get(id)!.name, (benchById.get(id)!.aliases ?? []).join(' | '), new Set(h.map((x) => x.score.model)).size] as [string, string, string, number])
      .sort((a, b) => b[3] - a[3] || a[1].localeCompare(b[1])),
  };
  return cached;
}
