// The rows of the benchmarks table (/benchmarks/). The page renders the first FIRST_ROWS of them, and
// /benchmarks/rows.json holds the rest, so the page's HTML stays small (src/components/BenchmarkRows.astro).
import { allSummaries, monthsBetween, AS_OF } from './data.ts';
import { familyOf } from './reigns.ts';
import { isArena } from './counts.ts';
import { epochReviewOf, type EpochVerdict } from './epoch-reviews.ts';
import { monthYear } from './format.ts';

/** Rows the page itself renders: one page of the filter script (PAGE in src/scripts/filter.ts). */
export const FIRST_ROWS = 150;

// where the newest score came from, for the Last added column's tooltip
export const ADDED_FROM: Record<string, string> = { leaderboard: 'its leaderboard', epoch: 'Epoch AI', card: 'a model card' };

// scoring methods, grouped the way people ask: fixed answers, graders, arenas, real events
export const METHOD_GROUP: Record<string, string> = {
  verified: 'fixed',
  'model-judged': 'graded',
  'expert-graded': 'graded',
  preference: 'arena',
  'head-to-head': 'arena',
  outcome: 'events',
};
export const STATUS: Record<string, string> = { 'in use': 'In use', fading: 'Fading', dropped: 'Dropped', 'system cards': 'System cards only', 'not in cards': 'Not in cards' };
// the order a sort by status puts them in
export const STATUS_RANK: Record<string, number> = { 'in use': 0, fading: 1, dropped: 2, 'system cards': 3, 'not in cards': 4 };

// arenas and match leagues have their own page (/arenas/), so this table holds only the tests with fixed standards
export const all = allSummaries().filter((s) => !isArena(s.b));
// one row per test: a versioned family shows its newest version and links the earlier ones
const newest = (id: string) => familyOf(id).at(-1);
// a family row ranks by its whole family, so a version too new to be cited (Terminal-Bench 4.1) doesn't sink a test
// labs have cited for years below the first rows shown
const byIdAll = new Map(all.map((s) => [s.b.id, s]));
const famTotal = (s: (typeof all)[number], f: (x: (typeof all)[number]) => number) => (s.b.family ? familyOf(s.b.id) : [s.b.id]).reduce((n, id) => n + (byIdAll.has(id) ? f(byIdAll.get(id)!) : 0), 0);
export const rows = all
  .filter((s) => !s.b.family || newest(s.b.id) === s.b.id)
  .map((s) => ({ s, cites: famTotal(s, (x) => x.cites.length), docs: famTotal(s, (x) => x.docCites.length), scores: famTotal(s, (x) => x.nScores) }))
  .sort((a, b) => b.cites - a.cites || b.docs - a.docs || b.scores - a.scores || a.s.b.name.localeCompare(b.s.b.name))
  .map((x) => x.s);
export type Row = (typeof rows)[number];

export const byId = new Map(all.map((s) => [s.b.id, s]));
// a family's earlier versions, newest first, so reading down goes back in time
export const earlier = (id: string) =>
  familyOf(id)
    .slice(0, -1)
    .map((v) => byId.get(v))
    // a family member that is an arena lives on /arenas/, not in this table
    .filter((s): s is NonNullable<typeof s> => !!s)
    .reverse();
export const vlabel = (v: string) => (/^\d+$/.test(v) ? `v${v}` : v);
// Epoch AI's verdicts: a row matches a verdict when it, or one of the earlier versions folded under it, has it, and
// those versions show under it while the filter is on (data-kid-keys)
export const reviewTokens = (ids: string[]) => {
  const vs = [...new Set(ids.map((id) => epochReviewOf(id)?.verdict).filter((v): v is EpochVerdict => !!v))];
  return vs.length ? ['reviewed', ...vs].join(' ') : undefined;
};

const labCount = (n: number) => (n === 1 ? '1 lab' : `${n} labs`);
type Cite = { card: { lab: string; date: string } };
export const citeTip = (xs: Cite[]) => {
  if (!xs.length) return undefined;
  const newest = xs.map((x) => x.card.date).sort().at(-1);
  return `${labCount(new Set(xs.map((x) => x.card.lab)).size)}, newest ${monthYear(newest)}`;
};
// the same count over the last 12 and 6 months, and the labs behind each, for the Cited dropdown:
// "posts in 12 months, posts in 6 months, labs in 12 months, labs in 6 months". None in 12 months leaves it out.
export const windowCounts = (xs: Cite[]) => {
  const within = (m: number) => xs.filter((x) => monthsBetween(x.card.date, AS_OF) < m);
  const [a, b] = [within(12), within(6)];
  if (!a.length) return undefined;
  const labs = (ys: Cite[]) => new Set(ys.map((y) => y.card.lab)).size;
  return `${a.length} ${b.length} ${labs(a)} ${labs(b)}`;
};
