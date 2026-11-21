// CASTLE tests whether models identify weaknesses in 250 C programs.
// Table 3 gives the CASTLE Score with precision, recall, accuracy and detection counts.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2503.09433';
const board: Leaderboard = {
  benchmark: 'castle-cwe', static: 'paper', url: feed, feed,
  terms: 'The authors make their aggregate results available through arXiv. https://arxiv.org/abs/2503.09433',
  aliases: { 'GPT-o3 Mini': 'o3-mini', 'Chat GPT-o1': 'o1', 'DeepSeek R1 (snapshot unspecified)': 'deepseek-r1',
    'QWEN 2.5CI (32B)': 'qwen2-5-coder-32b-instruct', 'GPT-4o Mini (snapshot unspecified)': 'gpt-4o-mini',
    'Gemma 2 (9B)': 'gemma-2-9b', 'LLAMA 3.1 (8B)': 'llama-3-1-8b' },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === 'Name|Version *|TP|TN|FP|FN|P|R|A|CASTLE Score');
    const start = t?.findIndex(r => r[0] === 'GPT-o3 Mini') ?? -1;
    if (!t || start < 0) throw new Error('Missing Table 3 model section');
    return checked(t.slice(start).map(([model,,tp,tn,fp,fn,p,r,a,score]) => ({
      model, score: numberCell(score), metrics: {
        truePositive: numberCell(tp), trueNegative: numberCell(tn), falsePositive: numberCell(fp), falseNegative: numberCell(fn),
        precision: numberCell(p.replace(/%$/, '')), recall: numberCell(r.replace(/%$/, '')), accuracy: numberCell(a.replace(/%$/, '')),
      },
    })), 10);
  },
};
export default board;
