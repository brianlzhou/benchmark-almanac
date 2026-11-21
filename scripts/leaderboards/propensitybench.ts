// PropensityBench uses Scale's published ranking. Its page embeds the model scores and confidence intervals.
import type { Leaderboard } from './types.ts';
import { fetchScaleEntries, SCALE_ALIASES, SCALE_TERMS } from '../lib/scale.ts';
import { scaleRowsWithInterval } from './swe-bench-pro.ts';

const board: Leaderboard = {
  benchmark: 'propensitybench', url: 'https://labs.scale.com/leaderboard/propensitybench', feed: 'https://labs.scale.com/leaderboard/propensitybench',
  terms: SCALE_TERMS, aliases: SCALE_ALIASES,
  async fetch() {
    const rows = scaleRowsWithInterval(await fetchScaleEntries(this.url));
    if (rows.length < 14) throw new Error('Incomplete Scale leaderboard');
    return rows;
  },
};
export default board;
