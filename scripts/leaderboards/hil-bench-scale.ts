// HiL-Bench uses Scale's published ranking. Its page embeds the model scores and confidence intervals.
import type { Leaderboard } from './types.ts';
import { fetchScaleEntries, SCALE_ALIASES, SCALE_TERMS } from '../lib/scale.ts';
import { scaleRowsWithInterval } from './swe-bench-pro.ts';

const board: Leaderboard = {
  benchmark: 'hil-bench-scale', url: 'https://labs.scale.com/leaderboard/hil', feed: 'https://labs.scale.com/leaderboard/hil',
  terms: SCALE_TERMS, aliases: SCALE_ALIASES,
  stats: { rank: { name: 'Leaderboard rank', unit: 'count', better: 'lower' } },
  async fetch() {
    const rows = scaleRowsWithInterval(await fetchScaleEntries(this.url), (name) => {
      if (name.model.endsWith(' (*public set only)')) return { model: name.model.replace(' (*public set only)',''), setting: 'public set only' };
      if (name.model === 'SWE-2 (*using Devin)') return { model: 'SWE-2', harness: 'Devin' };
    });
    if (rows.length < 37) throw new Error('Incomplete Scale leaderboard');
    return rows;
  },
};
export default board;
