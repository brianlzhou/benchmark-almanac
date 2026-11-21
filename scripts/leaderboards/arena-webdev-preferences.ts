// Arena measures how often a judge predicts which generated website the user preferred.
// Figure 3 gives overall agreement across categories. We transcribed its labels twice and compared both readings.
// The authors fine-tuned the reward models on Qwen-3.5-9B. The SHA-256 protects the chart transcription.
import { createHash } from 'node:crypto';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.17895v4/webdev_overall_comparison.svg';
const conditions = ['Code', 'Code + screenshot', 'Heuristic', 'One-shot', 'Iterative'];
const readings = [
  ['gemini-3-flash', 'LLM judge', [65.6, 67.6, 68.4, 68.3, 69.1]],
  ['gpt-5.6-luna', 'LLM judge', [68.3, 66.6, 67.2, 67.0, 67.9]],
  ['Qwen-3.5-9B reward model', 'Full code', [69.7, 70.0, 70.2, 70.2, 70.8]],
  ['Qwen-3.5-9B reward model', 'App.tsx', [68.2, 68.7, 69.8, 70.0, 70.2]],
  ['Qwen-3.5-9B reward model', 'Interaction only', [null, null, 67.5, 67.8, 69.0]],
] as const;

const board: Leaderboard = {
  benchmark: 'arena-webdev-preferences', static: 'paper', feed, url: 'https://arxiv.org/html/2610.17895v4#S4.F3',
  terms: 'Arena publishes Figure 3 in its paper under the terms at https://arxiv.org/abs/2610.17895.',
  async fetch() {
    const hash = createHash('sha256').update(await paperHtml(feed)).digest('hex');
    if (hash !== 'f115f3e8f1df0372478dc3937d3a19b1d3ca037605b881f51d66f561c2cbb0a2') throw new Error('Figure 3 changed');
    const rows: LeaderboardRow[] = [];
    for (const [model, input, scores] of readings) {
      scores.forEach((score, i) => {
        if (score !== null) rows.push({model, score, setting: input + ': ' + conditions[i], ...(input === 'LLM judge' ? {} : { trials: 5 })});
      });
    }
    return checked(rows, 23);
  },
};
export default board;
