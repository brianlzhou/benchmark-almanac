// SpreadsheetBench (v1, full 912 questions). spreadsheetbench.github.io renders its tabs from JSON files
// next to the page: data/leaderboard-v1-full.json (this board), leaderboard-v1-verified.json (the
// 400-question Verified tab) and leaderboard-v2-full.json (SpreadsheetBench 2). Each row has the system
// name, organization, verified flag, score (0 to 100) and date. Most rows are spreadsheet products
// rather than models, so only names the resolver can place are kept. The v2 board is read through
// spreadsheetRows by spreadsheetbench-2.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const SSB_PAGE = 'https://spreadsheetbench.github.io/';
export const SSB_TERMS = 'JSON files on the SpreadsheetBench GitHub Pages site that the page loads; the dataset is CC BY-SA 4.0 and the page states no other terms.';
export const ssbFeed = (file: string) => `${SSB_PAGE}data/${file}`;

interface Entry {
  model: string;
  scaffold?: string;
  score?: number;
  date?: string;
}

/** Rows of one SpreadsheetBench board file. A scaffold that is not the system's own name becomes the harness. */
export async function spreadsheetRows(file: string): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const e of await fetchJson<Entry[]>(ssbFeed(file))) {
    if (!e.model || typeof e.score !== 'number') continue;
    const harness = e.scaffold && e.scaffold !== e.model ? e.scaffold : undefined;
    // "OpenAI o3": the maker's name is not part of the model name
    rows.push({ model: e.model.replace(/^OpenAI\s+/, '').trim(), score: e.score, harness, date: e.date });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'spreadsheetbench',
  url: SSB_PAGE,
  feed: ssbFeed('leaderboard-v1-full.json'),
  terms: SSB_TERMS,
  aliases: {},
  fetch: () => spreadsheetRows('leaderboard-v1-full.json'),
};
export default board;
