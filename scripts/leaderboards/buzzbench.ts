// BuzzBench on eqbench.com. buzzbench.js holds the board as a CSV string (model, score, average length and a
// 95% interval). The score column is the score. Read through eqbenchRows in creative-writing-v3.ts.
// The 95% interval (c95_lower, c95_upper) is kept as metrics.ciLow and ciHigh, and avg_length as metrics.length,
// as creative-writing-v3.ts keeps it.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'buzzbench',
  url: 'https://eqbench.com/buzzbench.html',
  feed: `${eqbenchFeed('buzzbench.js', 'leaderboardDataBuzzbench')} score`,
  terms: EQBENCH_TERMS,
  aliases: {...EQBENCH_ALIASES, 'gemini-2.5-pro-preview-03-25': 'gemini-2-5-pro-mar-2025'},
  fetch: () => eqbenchRows('buzzbench.js', 'leaderboardDataBuzzbench', 'score', 1, { ciLow: 'c95_lower', ciHigh: 'c95_upper', length: 'avg_length' }),
};
// These source labels do not identify one dated API snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => /^(?:claude-3\.5-sonnet|gemini-pro-1\.5|deepseek-ai\/(?:deepseek-v3|deepseek-r1))$/i.test(r.model) ? {...r, model: r.model + ' (snapshot unspecified)'} : r);
export default board;
