// BlenderBench Refresh measures an agent's reward across 20 Blender scene, rigging, animation and simulation tasks.
// The Refresh article publishes the mean reward and estimated total cost for two named models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://www.refresh.dev/blog/blenderbench';
const board: Leaderboard = {
  benchmark: 'blenderbench-refresh', url: FEED, feed: FEED, static: 'paper',
  terms: 'The Refresh article is publicly readable. Link and attribute the source.',
  costPer: 'run',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    if (!/GPT-6 Astra.*0\.6861607/s.test(text) || !/Claude Opus 5\.5.*0\.6417865/s.test(text)) throw new Error('BlenderBench results missing');
    return checked([
      { model: 'GPT-6 Astra', score: 0.6861607, trials: 20, cost: 55.23 },
      { model: 'Claude Opus 5.5', score: 0.6417865, trials: 20, cost: 20.54 },
    ]);
  },
};
export default board;
