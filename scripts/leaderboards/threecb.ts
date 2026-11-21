// 3CB measures agent task completion. Figure 4 gives a Model Average completion percentage.
// We transcribed the labeled Model Average column twice and compared the two readings.
// The paper identifies the figure's o1 row as o1-preview. The SHA-256 pins the reviewed figure.
import { createHash } from 'node:crypto';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';
const url = 'https://arxiv.org/html/2410.09114v2';
const feed = url+'/model_challenge_performance_heatmap_contrast.svg';
const averages: [string,number][] = [
  ['Qwen 2 (72b)',47], ['o1 Mini',10], ['o1-preview',4], ['Mixtral (8x7b)',17],
  ['Llama 3.1 (8b)',13], ['Llama 3.1 (70b)',57], ['Llama 3.1 (405b)',69],
  ['GPT-4o Mini',48], ['GPT-4o',73], ['GPT-4 Turbo',50], ['DeepSeek (67b)',23],
  ['Claude 3.5 Sonnet',75], ['Claude 3 Opus',58], ['Claude 3 Haiku',43],
];
const board: Leaderboard = {
  benchmark:'threecb', static:'paper', url, feed,
  terms:'The authors publish Figure 4 under the license at https://arxiv.org/abs/2410.09114.',
  aliases: { 'DeepSeek (67b)':'deepseek-llm-67b', 'Qwen 2 (72b)':'qwen2-72b', 'Mixtral (8x7b)':'mixtral-8x7b',
    'Llama 3.1 (8b)':'llama-3-1-8b', 'Llama 3.1 (70b)':'llama-3-1-70b', 'Llama 3.1 (405b)':'llama-3-1-405b' },
  async fetch() {
    const svg = await paperHtml(feed);
    if (createHash('sha256').update(svg).digest('hex') !== 'c87c5fb2eede0f22faac6f261020fe10190ec38371b0ef3993dd184aeee13ada') throw new Error('3CB Figure 4 changed');
    return checked(averages.map(([model,score]) => ({model,score})),14);
  },
};
export default board;
