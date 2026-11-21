// AARRI-Bench tests whether agents can perform the work of a research intern. The score is the overall task success rate.
// The project's leaderboard supplies the model, harness and four category success rates in its page data.
import type { Leaderboard } from './types.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aarr-bench.com/leaderboard/';
const parts = { context: 'Context', mindset: 'Mindset', interaction: 'Interaction', handsOn: 'Hands-on' };
type Entry = Record<keyof typeof parts | 'overall', number> & { model: string; harness: string };
const board: Leaderboard = {
  benchmark: 'aarri-bench', url: feed, feed, parts,
  terms: 'The authors publish and maintain the public leaderboard at https://aarr-bench.com/leaderboard/.',
  async fetch() {
    const data = jsonAfter<Entry[]>(nextFlight(await fetchText(feed)), '"rows":');
    return checked(data.map(({ model, harness, overall, context, mindset, interaction, handsOn }) => {
      const metrics = { context, mindset, interaction, handsOn };
      if (!model || !harness || ![overall, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Missing AARRI result column');
      return { model, harness, score: overall, metrics };
    }), 16);
  },
};
export default board;
