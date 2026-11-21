// ArenaWebdevCorrectness tests whether a judge can verify working and broken game requirements.
// Figure 4 reports the unweighted average of those two verification accuracies, plus broken requirement discovery recall.
// The chart labels were read twice, from the rendered figure and its SVG glyphs. The SHA-256 guards the transcription.
import { createHash } from 'node:crypto';
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2610.17895v4/correctness_scaling.svg';
const readings = [
  ['Luna', 'Code Agent-as-a-Judge', 69.6, 51.6, 87.6, 14],
  ['Terra', 'Code Agent-as-a-Judge', 73.1, 59.6, 86.5, 17],
  ['Sol', 'Code Agent-as-a-Judge', 77.0, 63.0, 91.0, 25],
  ['Luna', 'Interaction-as-a-Judge', 76.4, 65.2, 87.6, 17],
  ['Terra', 'Interaction-as-a-Judge', 77.3, 68.0, 86.5, 15],
  ['Sol', 'Interaction-as-a-Judge', 81.6, 71.1, 92.1, 28],
] as const;
const board: Leaderboard = {
  benchmark: 'arena-webdev-correctness', static: 'paper', url: 'https://arxiv.org/html/2610.17895v4#S4.F4', feed,
  terms: 'The Arena team publishes Figure 4 in its paper. https://arxiv.org/abs/2610.17895',
  parts: { broken: 'Broken requirements verified', working: 'Working requirements verified', recall: 'Broken requirements recall' },
  async fetch() {
    const source = await paperHtml(feed);
    if (createHash('sha256').update(source).digest('hex') !== '19e246a8a2e30986157e0181410d9e6d047748dd11c1757632bf051e24a4d075') throw new Error('Figure 4 changed');
    return checked(readings.map(([name, harness, score, broken, working, recall]) => ({
      model: 'GPT 5.6 ' + name, harness, setting: 'Medium reasoning', score, metrics: { broken, working, recall },
    })), 6);
  },
};
export default board;
