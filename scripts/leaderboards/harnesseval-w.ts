// HarnessEval-W (xbench AGI Tracking series). The board ships as a literal array in the xbench.org bundle
// (see xbenchArray in xbench-scienceqa.ts): per video or world model the interface used (for example
// "Prompt I2V"), the observation, transition and persistence sub-scores and the overall score (0 to 100),
// which is the ranking and the score. The interface becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num } from '../lib/html.ts';
import { XBENCH_TERMS, xbenchArray } from './xbench-scienceqa.ts';

const board: Leaderboard = {
  benchmark: 'harnesseval-w',
  url: 'https://xbench.org/agi/harnesseval-w',
  feed: 'https://xbench.org/<build>/index-*.js (array with interface, obsR ... persO, overall)',
  terms: XBENCH_TERMS,
  aliases: {
    // ByteDance's Seedance 2.0, listed in the registry under its Dreamina product name
    'Seedance 2.0': 'dreamina-seedance-2-0',
    // the board ranks video models, so this is Grok Imagine Video 1.5
    'Grok Imagine 1.5': 'grok-imagine-video-1-5',
  },
  async fetch() {
    const data = await xbenchArray<{ model: string; interface?: string; overall: string }>(/\[\{model:"[^"]+",interface:"[^"]+",obsR:/);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = num(r.overall);
      if (r.model && score !== undefined) rows.push({ model: r.model, score, setting: r.interface || undefined });
    }
    return rows;
  },
};
export default board;
