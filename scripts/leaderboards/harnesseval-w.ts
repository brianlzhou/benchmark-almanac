// HarnessEval-W (xbench AGI Tracking series). The board ships as a literal array in the xbench.org bundle
// (see xbenchArray in xbench-scienceqa.ts): per video or world model the interface used (for example
// "Prompt I2V"), the observation, transition and persistence sub-scores and the overall score (0 to 100),
// which is the ranking and the score. The interface becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num } from '../lib/html.ts';
import { XBENCH_TERMS, xbenchArray } from './xbench-scienceqa.ts';

const PART_KEYS = ['obsR', 'obsP', 'transE', 'transI', 'transP', 'persD', 'persR', 'persO'] as const;

const board: Leaderboard = {
  benchmark: 'harnesseval-w',
  parts: {
    obsR: { name: 'Obs-R', group: 'Observation Quality' },
    obsP: { name: 'Obs-P', group: 'Observation Quality' },
    transE: { name: 'Trans-E', group: 'Transition Correctness' },
    transI: { name: 'Trans-I', group: 'Transition Correctness' },
    transP: { name: 'Trans-P', group: 'Transition Correctness' },
    persD: { name: 'Pers-D', group: 'World Persistence' },
    persR: { name: 'Pers-R', group: 'World Persistence' },
    persO: { name: 'Pers-O', group: 'World Persistence' },
  },
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
    const data = await xbenchArray<Record<string, string | undefined>>(/\[\{model:"[^"]+",interface:"[^"]+",obsR:/);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = num(r.overall);
      if (!r.model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const k of PART_KEYS) {
        const v = num(r[k]);
        if (v !== undefined) metrics[k] = v;
      }
      rows.push({ model: r.model, score, setting: r.interface || undefined, metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    return rows;
  },
};
export default board;
