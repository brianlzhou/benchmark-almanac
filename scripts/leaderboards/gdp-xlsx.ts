// GDP.xlsx: Surge publishes the primary model leaderboard in server-rendered HTML.
// The headline score is a percentage. Retain reasoning effort separately from the model name.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { surgeRows, SURGE_TERMS, SURGE_ALIASES } from '../lib/boards/surgehq-cov2.ts';
const PAGE = 'https://surgehq.ai/benchmarks/gdp-xlsx';
const board: Leaderboard = {
  benchmark: 'gdp-xlsx', url: PAGE, feed: PAGE, terms: SURGE_TERMS, aliases: SURGE_ALIASES,
  async fetch() { return surgeRows(await fetchText(PAGE)); },
};
export default board;
