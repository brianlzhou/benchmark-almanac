// SATBench tests logical reasoning on puzzles generated from satisfiable and unsatisfiable formulas.
// Table 3 of the EMNLP paper reports average zero-shot accuracy and results for each difficulty level.
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://aclanthology.org/2025.emnlp-main.1716.pdf';
const parts = ['SAT','UNSAT','Overall'].flatMap(group => ['Easy','Medium','Hard'].map(name => ({key: group + ' ' + name, group, name})));
const board: Leaderboard = {
  benchmark: 'satbench', url: feed, feed, static: 'paper',
  terms: 'ACL Anthology publishes this paper under the terms at https://aclanthology.org/2025.emnlp-main.1716/.',
  parts: Object.fromEntries(parts.map(({key, name, group}) => [key,{name, group}])),
  aliases: {'DeepSeek-Distill-7B': 'deepseek-r1-distill-qwen-7b', 'DeepSeek-Distill-14B': 'deepseek-r1-distill-qwen-14b',
    'DeepSeek-Distill-32B': 'deepseek-r1-distill-qwen-32b', 'Qwen-QwQ-32B': 'qwq-32b'},
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 3: Model accuracy on SATBench')[0].split(/SAT\s+UNSAT\s+Overall\s+Model\s+Avg\./).at(-1);
    if (!table || !/Easy\s+Medium\s+Hard\s+Easy\s+Medium\s+Hard\s+Easy\s+Medium\s+Hard/.test(table)) throw new Error('Missing Table 3 accuracy columns');
    const body = table.split(/Random Baseline[^\n]*\n/)[1]?.split(/\n\s*Average\s/)[0];
    if (!body) throw new Error('Missing model rows');
    return checked(body.trim().split('\n').map(line => {
      const [model, ...cells] = line.trim().split(/\s+/);
      const nums = cells.map(Number);
      if (nums.length !== 10 || !nums.every(Number.isFinite)) throw new Error('Invalid Table 3 row: ' + line);
      return {model, score: nums[9], setting: 'Zero-shot', metrics: Object.fromEntries(parts.map(({key},i) => [key,nums[i]]))};
    }), 20);
  },
};
export default board;
