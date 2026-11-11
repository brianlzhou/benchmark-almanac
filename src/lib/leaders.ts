// Pick and order the rows of a "who held number one" chart.
import { benchSummary, modelById, cards, systemCards } from './data.ts';
import { reignRow, familyOf, originsOf, type ReignRow, type Source, type Origin } from './reigns.ts';
import type { Score } from './types.ts';
import { levelIndex, RANKED_BY_PEOPLE_OR_MATCHES } from './taxonomy.ts';
import { makerParts } from './makers.ts';

/**
 * Whether the benchmark is a real race in the given pool. A lab's internal eval, which only that lab runs on
 * its own models, always has that lab at number one, so it earns no credit. A lab's own eval that only lab
 * claims cover also needs two other labs reporting it. Independent runs (a leaderboard, Epoch AI) settle it.
 */
function contested(s: ReturnType<typeof benchSummary>, source: Source): boolean {
  const boards: Record<Origin, Score[]> = { leaderboard: s.leaderboardBoard, epoch: s.epochBoard, collected: s.viaBoard, card: s.cardBoard, claim: s.claimBoard };
  const pool = originsOf(s.b.id, source).flatMap((o) => boards[o]);
  const labs = new Set(pool.map((x) => modelById.get(x.model)?.lab).filter((l): l is string => !!l));
  if (labs.size < 2) return false;
  // an independent run settles it: anything but a lab's card or a claim Epoch AI collected
  if (pool.some((x) => x.source !== 'card' && !(x.source === 'collected' && x.via !== 'board'))) return true;
  const makers = new Set(makerParts(s.b.org ?? '').map((p) => p.lab).filter(Boolean));
  return makers.size === 0 || [...labs].filter((l) => !makers.has(l)).length >= 2;
}

/**
 * Reign rows for a set of benchmarks: percentage scores, three or more models from two or more labs,
 * easiest level first.
 * `source` is one source, or a pool: 'all' (lab claims included) or 'independent'.
 * Versions of one test travel together: picking one brings the others, and they sit side by side,
 * oldest first, so each hands over to the next.
 */
export function leaderRows(ids: string[], source: Source, limit = 14): ReignRow[] {
  const pick = (id: string) => ({ id, s: benchSummary(id), row: reignRow(id, source) });
  type Pick = { id: string; s: ReturnType<typeof benchSummary>; row: ReignRow };
  const ok = (x: ReturnType<typeof pick>): x is Pick =>
    !!x.row && x.row.unit === '%' && x.row.reigns.length >= 1 && !RANKED_BY_PEOPLE_OR_MATCHES.has(x.s.b.scoring ?? '') && contested(x.s, source);
  const chosen = ids
    .map(pick)
    .filter(ok)
    .sort((a, b) => b.s.cites.length + b.s.nScores - (a.s.cites.length + a.s.nScores))
    .slice(0, limit);
  const have = new Set(chosen.map((x) => x.id));
  for (const x of [...chosen]) for (const v of familyOf(x.id)) if (!have.has(v)) {
    const y = pick(v);
    if (ok(y)) {
      chosen.push(y);
      have.add(v);
    }
  }
  // a family sits at the level of its newest version, from the start of its oldest, and its members by release
  const anchor = (x: Pick) => {
    const fam = familyOf(x.id).filter((v) => have.has(v));
    const head = chosen.find((y) => y.id === fam[0]) ?? x;
    const newest = chosen.find((y) => y.id === fam.at(-1)) ?? x;
    return { level: rank(newest.s.b.level), start: head.row.reigns[0].start, fam: head.id, pos: fam.indexOf(x.id) };
  };
  return chosen
    .map((x) => ({ x, a: anchor(x) }))
    .sort((p, q) => p.a.level - q.a.level || p.a.start.localeCompare(q.a.start) || p.a.fam.localeCompare(q.a.fam) || p.a.pos - q.a.pos)
    .map((p) => p.x.row);
}

/**
 * Reign rows for the benchmarks the most model releases reported in the year before `asOf`. A release counts
 * once per benchmark, whether the launch post or its system card reported it. Versions of one test count
 * together. Each version that at least `minVersion` releases reported that year gets a row, oldest first, and
 * the tests come in order of releases, most first. Only tests with a reign row in the 'all' pool take a place,
 * so the same tests show with lab claims on and off.
 */
export function mostReportedRows(asOf: string, families = 7, minVersion = 3) {
  const since = new Date(Date.parse(asOf) - 365 * 864e5).toISOString().slice(0, 10);
  const famKey = (id: string) => familyOf(id)[0];
  const byFam = new Map<string, Set<string>>();
  const byVersion = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, k: string, v: string) => (m.get(k) ?? m.set(k, new Set()).get(k)!).add(v);
  for (const d of [...cards, ...systemCards]) {
    if (!d.date || d.date < since || d.date > asOf) continue;
    const release = d.release ?? d.id;
    for (const r of d.results) {
      add(byFam, famKey(r.benchmark), release);
      add(byVersion, r.benchmark, release);
    }
  }
  const usable = (id: string, source: Source) => {
    const row = reignRow(id, source);
    const s = benchSummary(id);
    return row && row.unit === '%' && row.reigns.length >= 1 && !RANKED_BY_PEOPLE_OR_MATCHES.has(s.b.scoring ?? '') && contested(s, source) ? row : null;
  };
  const versions = (fam: string) => familyOf(fam).filter((id) => (byVersion.get(id)?.size ?? 0) >= minVersion);
  const picked = [...byFam.entries()]
    .map(([fam, rel]) => ({ fam, n: rel.size, ids: versions(fam).filter((id) => usable(id, 'all')) }))
    .filter((f) => f.ids.length > 0)
    .sort((a, b) => b.n - a.n || a.fam.localeCompare(b.fam))
    .slice(0, families);
  const rows = (source: Source) => picked.flatMap((f) => f.ids.map((id) => usable(id, source)).filter((r): r is ReignRow => !!r));
  return { since, tests: picked, all: rows('all'), independent: rows('independent'), headline: rows('headline') };
}

// rows without a level go last
function rank(level: string | null | undefined): number {
  const i = levelIndex(level ?? undefined);
  return i < 0 ? 99 : i;
}

/**
 * The longest runs at number one that are still going today, on the tests the most model releases reported in
 * the year before `asOf` (the `mostReportedRows` pick, with more tests). One run per test version: its current
 * holder, counted from the day it took the top spot. A version nobody has tested in six weeks is left out, since
 * nobody is racing for it now.
 */
export function currentRuns(asOf: string, source: 'all' | 'independent' | 'headline', families = 12) {
  const picked = mostReportedRows(asOf, families);
  const day = 86_400_000;
  const runs = picked[source]
    .filter((r) => (Date.parse(asOf) - Date.parse(r.lastTested)) / day <= 45)
    .flatMap((r) => {
      const g = r.reigns.at(-1);
      return g && g.end >= asOf ? [{ g, b: r.benchmark, months: (Date.parse(asOf) - Date.parse(g.start)) / day / 30.4, start: g.start, end: asOf }] : [];
    })
    .sort((a, b) => b.months - a.months);
  return { tests: picked.tests.length, since: picked.since, runs };
}
