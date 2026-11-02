// Clipping Bench (naive). usenaive.ai/benchmark/clipping-bench is server-rendered (Next.js) with one
// leaderboard table: rank, model (name, then maker and run count) and final cash balance in US dollars,
// mean over runs with a "±" spread. The mean cash balance is the score (the board's unit, dollars).
// short-form-bench.ts reads the same page layout through naiveRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

export const NAIVE_TERMS = 'Server-rendered public page on usenaive.ai; robots.txt allows all paths and the naive terms do not restrict reading it.';

/** Rows of the first table on a naive benchmark page: model name and the first dollar figure after it. */
export async function naiveRows(url: string): Promise<LeaderboardRow[]> {
  const table = (await fetchText(url)).match(/<table[\s\S]*?<\/table>/)?.[0];
  if (!table) throw new Error(`no table on ${url}`);
  const rows: LeaderboardRow[] = [];
  for (const tr of table.matchAll(/<tr\b[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].replace(/<svg[\s\S]*?<\/svg>/g, '').matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cells.length < 3) continue;
    // the name is the first span; maker and run count follow in a second span
    const name = text(cells[1].match(/<span[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '');
    const value = num(text(cells[2]).split('±')[0]);
    if (name && value !== undefined) rows.push({ model: name, score: value });
  }
  return rows;
}

const URL = 'https://usenaive.ai/benchmark/clipping-bench';

const board: Leaderboard = {
  benchmark: 'clipping-bench',
  url: URL,
  feed: `${URL} (server-rendered table, cash balance)`,
  terms: NAIVE_TERMS,
  aliases: {},
  fetch: () => naiveRows(URL),
};
export default board;
