// RBench-M tests graduate-level multimodal reasoning in English and Chinese.
// The official multimodal leaderboard supplies average top-1 accuracy and both language scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://evalmodels.github.io/rbench/';
export default {
  benchmark: 'rbench-m', url, feed: url,
  parts: { en: 'RBench-M (English)', zh: 'RBench-M (Chinese)' },
  terms: 'The benchmark authors publish the scores and license RBench under Apache 2.0. https://huggingface.co/datasets/R-Bench/R-Bench',
  aliases: { 'OpenAI GPT-5': 'gpt-5', 'OpenAI o1': 'o1', 'Seed-1.6': 'doubao-seed-1-6', 'Doubao1.5Pro': 'doubao-1-5-pro',
    'Llama3.2V-11B-Instruct': 'llama-3-2-11b', 'Gemini1.5-Pro (2024-02-15)': 'gemini-1-5-pro-feb-2024',
    'GPT-4o (2024-11-20)': 'gpt-4o-nov-2024', 'Claude-3-5-sonnet (1022)': 'claude-3-5-sonnet-october-2024' },
  async fetch() {
    const html = (await fetchText(url)).replace(/<!--[\s\S]*?-->/g, '');
    const table = paperTables(html).map(grid).find(t => t[0]?.join('|') === 'Model|Source|Date|Average|RBench-M|RBench-M (zh)');
    if (!table) throw new Error('Missing RBench-M language columns');
    return checked(table.slice(1).map(([name, , date, average, en, zh]) => {
      let model = name.replace(/[🥇🥈🥉]/gu, '').trim();
      if (model === 'GPT-4o' && date === '2024-11-20') model += ' (2024-11-20)';
      if (model === 'Gemini1.5-Pro' && date === '2024-2-15') model += ' (2024-02-15)';
      // Table 6 identifies the two Qwen vision models and the Claude snapshot behind these score pairs.
      if (model === 'Qwen2.5-72B' && en === '25.1' && zh === '25.7') model = 'Qwen2-VL-72B';
      if (model === 'Qwen2.5-7B' && en === '19.6' && zh === '22.3') model = 'Qwen2-VL-7B';
      if (model === 'Claude-3-5-sonnet' && en === '39.7' && zh === '38.3') model += ' (1022)';
      if ([average, en, zh].some(s => !/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid RBench-M scores for ' + model);
      return { model, score: Number(average), metrics: { en: Number(en), zh: Number(zh) } };
    }), 15);
  },
} satisfies Leaderboard;
