// Alibaba reports the percentage of 87 capture-the-flag tasks each model solves.
// Two transcription passes agreed on all six chart labels. The image hash guards the scores.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/datasets/Alibaba-AAIG/alibaba-ctf';
const feed = url + '/resolve/main/assets/leaderboard.png';
const board: Leaderboard = {
  benchmark: 'alibaba-ctf', url, feed,
  terms: 'Alibaba licenses the dataset under Apache 2.0 at https://huggingface.co/datasets/Alibaba-AAIG/alibaba-ctf#license.',
  async fetch() {
    const rows = await chartRows(feed, '4da81aba2247acb95821a311a73622618e6d4578e006282b6ca6aa46e1c2a7cf', [
      { model: 'GPT-5.6-Sol', score: 62.1 },
      { model: 'Qwen3.8-Max', score: 57.5 },
      { model: 'GLM-5.3', score: 48.3 },
      { model: 'Qwen3.7-Max', score: 34.5 },
      { model: 'GLM-5.2', score: 28.7 },
      { model: 'DeepSeek-V4-Pro', score: 26.4 },
    ]);
    return checked(rows, 6);
  },
};
export default board;
