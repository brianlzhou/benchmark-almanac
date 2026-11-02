// TaxCalcBench (Column Tax), Tax Year 2024 "v1" edition: 51 federal-only returns. taxcalcbench.ai draws its
// board from /data/leaderboard.js, a generated `window.TCB_DATA = {...}` object (from the column-tax/
// tax-calc-bench repository) with one entry per tax-year edition. The board ranks by "Correct returns
// (strict)" by default, so the score is `strict`, the percent of returns computed exactly right. Runs with
// web search get the setting "web search"; `cost` is US dollars per return. taxcalcbench-2.ts reads the
// Tax Year 2025 "v2" edition through tcbRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

export const TCB_PAGE = 'https://taxcalcbench.ai/';
export const TCB_FEED = 'https://taxcalcbench.ai/data/leaderboard.js';
export const TCB_TERMS = 'Generated data file the public board loads (robots.txt is not set); the tax-calc-bench repository is MIT-licensed.';

interface Row {
  base: string;
  webSearch: boolean;
  strict: number | null;
  cost: number | null;
}

/** Board names the shared resolver cannot place (shared with taxcalcbench-2.ts). */
export const TCB_ALIASES: Record<string, string> = {
  'Meta Muse Wonder': 'muse-wonder',
  'Meta Muse Spark 1.3': 'muse-spark-1-3',
  'Meta Muse Spark 1.2': 'muse-spark-1-2',
  'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
};

/** Every row of one tax-year edition ("v1" or "v2"). */
export async function tcbRows(edition: string): Promise<LeaderboardRow[]> {
  const data = jsonAfter<{ years: { edition: string; rows: Row[] }[] }>(await fetchText(TCB_FEED), 'window.TCB_DATA =');
  const year = data.years.find((y) => y.edition === edition);
  if (!year) throw new Error(`no ${edition} edition in TaxCalcBench data`);
  return year.rows
    .filter((r) => typeof r.strict === 'number')
    .map((r) => ({ model: r.base, score: r.strict!, setting: r.webSearch ? 'web search' : undefined, cost: r.cost ?? undefined }));
}

const board: Leaderboard = {
  benchmark: 'taxcalcbench',
  url: TCB_PAGE,
  feed: `${TCB_FEED} (edition v1, strict)`,
  terms: TCB_TERMS,
  aliases: TCB_ALIASES,
  fetch: () => tcbRows('v1'),
};
export default board;
