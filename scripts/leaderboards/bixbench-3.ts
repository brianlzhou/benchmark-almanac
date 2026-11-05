// BixBench 3 on Edison Scientific's research site, laid out like LABBench2: a static leaderboard table with
// # | Model | Average score | Average cost (USD) | Average output tokens | Published. Average score (0 to 1,
// shown here as 0 to 100) is the score, average cost the cost of one task, average output tokens the tokens
// of one task ("250.5k"), and Published the date (a "New" badge before the date is ignored). A note such as "(with fallback)" stays in the name. The reader lives
// in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://advances.edisonscientific.com/benchmarks/bixbench3/';

const board: Leaderboard = {
  benchmark: 'bixbench-3',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static public page; the site has no robots.txt and no terms, and describes itself as hosting leaderboards and source data for its benchmarks.',
  aliases: {
    // Claude Fable 5.1 run with a fallback model for refused calls, as the board labels it
    'claude-fable-5.1 (with fallback)': 'claude-fable-5-1',
  },
  fetch: () =>
    tableRows(URL, { model: /^Model$/i, score: /^Average score$/i, scale: 100, cost: /^Average cost/i, tokens: /^Average output tokens/i, date: /^Published$/i }),
};
export default board;
