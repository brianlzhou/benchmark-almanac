// BrokenMath measures how often a model attempts to prove a false theorem. Lower sycophancy is better.
// The project site's main results give the sycophancy and utility rates. Its prompt and fine-tuning charts add runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://sycophanticmath.ai/static/js/index.js';
const board: Leaderboard = {
  benchmark: 'brokenmath', url: 'https://sycophanticmath.ai/', feed,
  terms: 'The authors publish the project code under Apache 2.0. https://github.com/insait-institute/broken-math',
  stats: {
    utility: { name: 'Utility rate', unit: '%', better: 'higher', note: 'Rate of useful responses in the project results.' },
  },
  aliases: { 'DeepSeek-R1-Qwen3-8B': 'deepseek-r1-0528-qwen3-8b' },
  async fetch() {
    const js = await fetchText(feed);
    const source = /const projectData\s*=\s*({[\s\S]*?})\s*;/.exec(js)?.[1];
    if (!source || !js.includes('sycophancy: values[0]') || !js.includes('utility: values[1]')) throw new Error('Missing project results columns');
    const data: Record<string, Record<string, number[]>> = JSON.parse(source);
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, values: number[], optimized = false) {
      if (values.length !== 2 || !values.every(n => Number.isFinite(n) && n >= 0 && n <= 1)) throw new Error('Invalid rates for ' + model);
      rows.push({model, score: 100 * values[optimized ? 1 : 0], setting, ...(optimized ? {} : {metrics: {utility: 100 * values[1]}})});
    }
    for (const [model, values] of Object.entries(data.main)) add(model, 'Standard prompt', values);
    for (const [model, values] of Object.entries(data.prompt)) add(model, 'Optimized prompt', values, true);
    for (const [model, values] of Object.entries(data.finetune)) {
      if (!(model in data.main)) add(model, 'Standard prompt', values);
    }
    return checked(rows, 16);
  },
};
export default board;
