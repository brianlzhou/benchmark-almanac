// Pick and order the rows of a "who held number one" chart.
import { benchmarks, benchSummary } from './data.ts';
import { reignRow, type ReignRow, type Source } from './reigns.ts';
import { levelIndex, RANKED_BY_PEOPLE_OR_MATCHES } from './taxonomy.ts';

/** Reign rows for a set of benchmarks: percentage scores, three or more models, easiest level first. */
export function leaderRows(ids: string[], source: Source, limit = 14): ReignRow[] {
  return ids
    .map((id) => ({ id, s: benchSummary(id), row: reignRow(id, source) }))
    .filter((x): x is { id: string; s: ReturnType<typeof benchSummary>; row: ReignRow } => !!x.row && x.row.unit === '%' && x.row.reigns.length >= 1)
    .filter((x) => !RANKED_BY_PEOPLE_OR_MATCHES.has(x.s.b.scoring ?? ''))
    .sort((a, b) => b.s.cites.length + b.s.nScores - (a.s.cites.length + a.s.nScores))
    .slice(0, limit)
    .sort((a, b) => levelIndex(a.s.b.level ?? undefined) - levelIndex(b.s.b.level ?? undefined) || a.row.reigns[0].start.localeCompare(b.row.reigns[0].start))
    .map((x) => x.row);
}

export const idsIn = (category: string) => benchmarks.filter((b) => b.category === category).map((b) => b.id);
