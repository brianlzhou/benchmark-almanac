// SpeedrunBench compares game completion times with human world records. Figure 1 reports the mean
// across six games, with the world record at 100% and lower values better. Its caption says:
// "With the world record as an anchor (100%), we average the time the model took to reach the goal across the games".
// The labels were transcribed twice and checked against the figure's SHA-256. Figure 8 has unlabeled per-game bars.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2610.08076v1/table1_bymodel.png';
const board: Leaderboard = {
  benchmark: 'speedrunbench', static: 'paper', url: 'https://arxiv.org/html/2610.08076', feed, terms: PAPER_TERMS,
  headline: 'Mean completion time as a percentage of the human world record across six games. Lower is better.',
  async fetch() {
    const rows = await chartRows(feed,'7f26cf93dafd124d35cbcfa9eef65ead46f77e6364c661016bd18635e3dae5c4',[
      { model: 'Claude Opus 5', score: 316 }, { model: 'GLM 5.3', score: 333 },
      { model: 'GPT-5.6 Sol', score: 339 }, { model: 'Grok 4.6', score: 342 },
      { model: 'DeepSeek V4 Pro', score: 346 }, { model: 'DeepSeek V4 Flash', score: 354 },
      { model: 'Kimi-K3', score: 355 }, { model: 'Gemini 3.7 Flash', score: 359 },
      { model: 'GLM 5.2', score: 422 }, { model: 'Inkling-Small', score: 432 },
    ]);
    return checked(rows,10);
  },
};
export default board;
