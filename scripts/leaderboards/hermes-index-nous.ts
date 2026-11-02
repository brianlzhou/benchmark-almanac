// Hermes Index (Nous Research). portal.nousresearch.com/bench is server-rendered (Next.js). Its leaderboard
// table marks each cell with data-column: model (name, then maker), index (the Hermes Index, mean pass@1
// over Hermes Bench, Terminal-Bench 4.0, Terminal-Bench Science and SkillsBench), cost (mean cost per task
// across the four suites), then one cell per suite with its score and cost per task. The index is the score
// and its cost per task is kept. hermes-bench-nous.ts reads the eval column through hermesRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

export const HERMES_PAGE = 'https://portal.nousresearch.com/bench';
/** Nous display names the shared resolver cannot place. */
export const HERMES_ALIASES: Record<string, string> = {
  'Gemini Flash 3.8': 'gemini-3-8-flash',
};

export const HERMES_TERMS =
  'Server-rendered public page; robots.txt allows /bench (it disallows /api/ and account pages) and the Nous Research terms do not restrict reading it.';

/** Rows of the Hermes leaderboard: score from the `score` column, cost from `cost` (or the score cell itself). */
export async function hermesRows(score: string, cost?: string): Promise<LeaderboardRow[]> {
  const html = await fetchText(HERMES_PAGE);
  const table = html.match(/<table[\s\S]*?<\/table>/)?.[0];
  if (!table) throw new Error('no table on the Hermes bench page');
  const rows: LeaderboardRow[] = [];
  for (const tr of table.matchAll(/<tr\b[\s\S]*?<\/tr>/g)) {
    const cells = new Map([...tr[0].matchAll(/<td\b[^>]*data-column="([^"]+)"[^>]*>([\s\S]*?)<\/td>/g)].map((m) => [m[1], m[2]]));
    const modelCell = cells.get('model');
    if (!modelCell) continue;
    // the name and the maker are two spans inside one span
    const name = text(modelCell.match(/<span[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '');
    const scoreText = text(cells.get(score) ?? '');
    const value = num(scoreText.split('$')[0]);
    if (!name || value === undefined) continue;
    const costText = cost ? text(cells.get(cost) ?? '') : scoreText;
    const c = costText.match(/\$\s*([\d.]+)/)?.[1];
    rows.push({ model: name, score: value, harness: 'Hermes Agent', cost: c ? Number(c) : undefined });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'hermes-index-nous',
  url: HERMES_PAGE,
  feed: `${HERMES_PAGE} (server-rendered table, index column)`,
  terms: HERMES_TERMS,
  aliases: HERMES_ALIASES,
  fetch: () => hermesRows('index', 'cost'),
};
export default board;
