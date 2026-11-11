// The score pools a benchmark page can switch between, and what each one says about who leads.
//
//   headline     the one source the page leads with (data.ts boardSource): the official leaderboard when it's
//                current, else Epoch AI's runs, else a board Epoch AI copied, else the labs' own numbers.
//                /leaders/ credits leads and close-outs from this source too, so the two pages agree.
//   independent  every independent run: the official leaderboard, Epoch AI's runs and boards Epoch AI copied.
//   all          those plus the labs' own numbers and the claims Epoch AI collected from reports and papers.
//
// A page offers a pool only when it changes the ranking. The URL keeps the choice (?pool=independent).
import { benchSummary, bestPerModel, fromName, modelById, labById, type BenchSummary, type BoardSource } from './data.ts';
import { reignRow } from './reigns.ts';
import { longMonthYear } from './format.ts';
import type { Score } from './types.ts';

export type Pool = 'headline' | 'independent' | 'all';
export const POOLS: Pool[] = ['headline', 'independent', 'all'];

/** The switch label for the source a page leads with. */
export function sourceName(src: BoardSource | null, s?: BenchSummary): string {
  if (src === 'leaderboard') return 'Official leaderboard';
  if (src === 'epoch') return 'Epoch AI runs';
  if (src === 'collected') return s?.board[0] ? fromName(s.board[0]) : 'Board via Epoch AI';
  if (src === 'claim') return 'Collected claims';
  return 'Labs’ own numbers';
}

export const POOL_LABEL: Record<Exclude<Pool, 'headline'>, string> = { independent: 'All independent runs', all: 'Include claimed scores' };

export interface PoolView {
  pool: Pool;
  label: string;
  /** Best score per model in this pool, best first. */
  board: Score[];
  best?: Score;
  /** When the leader took the top spot, if it still holds it. */
  since?: string;
  /** Models that held number one since `from`. */
  holders: number;
}

const name = (id: string) => modelById.get(id)?.name ?? id;
const sig = (xs: Score[]) => xs.map((x) => `${x.model}:${x.value}`).join('|');

/** The pools worth offering on a benchmark's page, headline first. */
export function poolViews(id: string, from: string): PoolView[] {
  const s = benchSummary(id);
  const view = (pool: Pool, label: string, board: Score[]): PoolView => {
    const row = reignRow(id, pool);
    const last = row?.reigns.at(-1);
    const best = board[0];
    return {
      pool,
      label,
      board,
      best,
      since: last && best && last.model === best.model ? last.start : undefined,
      holders: row ? new Set(row.reigns.filter((g) => g.end > from).map((g) => g.model)).size : 0,
    };
  };
  const out = [view('headline', sourceName(s.boardSource, s), s.board)];
  const ind = bestPerModel([...s.leaderboardBoard, ...s.epochBoard, ...s.viaBoard], s.b);
  const all = bestPerModel([...ind, ...s.cardBoard, ...s.claimBoard], s.b);
  if (ind.length && sig(ind) !== sig(s.board)) out.push(view('independent', POOL_LABEL.independent, ind));
  if (all.length && !out.some((v) => sig(v.board) === sig(all))) out.push(view('all', POOL_LABEL.all, all));
  return out.length > 1 ? out : out.slice(0, 1);
}

/** Who a score is from, as a phrase: "Epoch AI’s run of Claude Fable 5.2". */
export function whose(x: Pick<Score, 'model' | 'source' | 'via' | 'from'>): string {
  const m = name(x.model);
  if (x.source === 'leaderboard') return `${m} on the official leaderboard`;
  if (x.source === 'epoch') return `Epoch AI’s run of ${m}`;
  if (x.source === 'card') return `${labById.get(modelById.get(x.model)?.lab ?? '')?.name ?? 'Its lab'}’s own number for ${m}`;
  if (x.via === 'board') return `${m} on ${fromName(x)}, via Epoch AI`;
  return `a claim for ${m} that Epoch AI collected`;
}

/**
 * One line for under the masthead: an independent score from another source, for a model the headline source
 * hasn't tested, that beats the headline leader. "Epoch AI’s run of Claude Fable 5.2, released November 9,
 * scored 94%. The official leaderboard hasn’t tested it yet."
 */
export function aheadElsewhere(id: string, fmt: (v: number) => string): string | undefined {
  const s = benchSummary(id);
  const src = s.boardSource;
  if (!s.best || (src !== 'leaderboard' && src !== 'epoch' && src !== 'collected')) return undefined;
  const tested = new Set(s.board.map((x) => x.model));
  const sign = s.b.better === 'lower' ? -1 : 1;
  const others = [
    ...(src === 'leaderboard' ? [] : s.leaderboardBoard),
    ...(src === 'epoch' ? [] : s.epochBoard),
    ...(src === 'collected' ? [] : s.viaBoard),
  ].filter((x) => !tested.has(x.model) && sign * x.value > sign * s.best!.value);
  const top = bestPerModel(others, s.b)[0];
  if (!top) return undefined;
  const m = modelById.get(top.model);
  const released = m?.released ? `, released ${longMonthYear(m.released)},` : '';
  const who = whose(top);
  const here = src === 'leaderboard' ? 'The official leaderboard' : src === 'epoch' ? 'Epoch AI' : fromName(s.board[0]);
  return `${who[0].toUpperCase()}${who.slice(1)}${released} scored ${fmt(top.value)}. ${here} hasn’t tested it yet.`;
}

/** The first score past the line, from the scores-over-time chart, with its source: for that chart's title. */
export function firstPast(s: BenchSummary, line: number): { date: string; who: string } | undefined {
  if (s.b.better === 'lower') return undefined;
  const p = s.frontier.find((x) => x.value >= line);
  return p ? { date: p.date, who: whose(p) } : undefined;
}
