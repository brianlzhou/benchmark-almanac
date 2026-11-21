// Language-Table measures a simulated robot's ability to follow natural-language instructions.
// Figure 6 reports success and success weighted by path length (SPL), which the authors prefer.
// Two readings of the printed values and interval widths agreed. The hash guards their association with each series.
import type { Leaderboard } from './types.ts';
import { createHash } from 'node:crypto';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2210.06407v1/ablations-combined.svg';
const board: Leaderboard = {
  benchmark: 'language-table', url: 'https://arxiv.org/html/2210.06407#S6.F6', feed, static: 'paper',
  terms: 'Google Research publishes Figure 6 in the benchmark paper at https://arxiv.org/abs/2210.06407.',
  stats: {success:{name:'Success rate',unit:'score',better:'higher',note:'Stored from 0 to 1.'}},
  async fetch() {
    const svg = await paperHtml(feed);
    if (createHash('sha256').update(svg).digest('hex') !== '13c8fcb63b4409d5c585115cfede0d3d628b2e5cbc6fb4078043a2378111237f') throw new Error('Language-Table Figure 6 changed');
    const values: [string, number, number, number, number, number][] = [
      ['LAVA', 10, 0.185, 0.02, 0.328, 0.02],
      ['LAVA', 20, 0.260, 0.08, 0.495, 0.11],
      ['LAVA', 50, 0.475, 0.04, 0.763, 0.06],
      ['LAVA', 100, 0.533, 0.02, 0.772, 0.04],
      ['ResNet-18 FiLM', 100, 0.412, 0.02, 0.724, 0.03],
    ];
    return checked(values.map(([model, percent, score, width, success, successWidth]) => ({
      model, setting: percent + '% of training data', score, trials: 3, low: score - width, high: score + width,
      metrics: { success, successLow: success - successWidth, successHigh: success + successWidth },
    })), 5);
  },
};
export default board;
