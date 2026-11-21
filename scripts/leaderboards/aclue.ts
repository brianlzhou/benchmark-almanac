// ACLUE tests ancient Chinese understanding with 15 multiple-choice tasks.
// The README ranks zero-shot runs by average accuracy and reports five capability scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/isen-zhang/ACLUE';
const feed = 'https://raw.githubusercontent.com/isen-zhang/ACLUE/HEAD/README.md';
const capabilities = ['词汇','句法','语义','推理','知识'];
export default {
  benchmark: 'aclue', url, feed,
  terms: 'The project uses MIT and the dataset uses https://creativecommons.org/licenses/by-nc-sa/4.0/',
  aliases: { "Baichuan-7B": "baichuan1-7b" },
  parts: Object.fromEntries(capabilities.map(name => [name,name])),
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === ['模型',...capabilities,'平均值'].join('|'));
    if (!table) throw new Error('Missing ACLUE zero-shot leaderboard');
    return checked(table.slice(1).filter(r => r[0] !== 'Random').map(([model,...cells]) => {
      if (cells.length !== 6 || !cells.every(c => /^\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid ACLUE scores');
      return { model, setting: 'Zero-shot', score: Number(cells[5]),
        metrics: Object.fromEntries(capabilities.map((k,i) => [k,Number(cells[i])])) };
    }),8);
  },
} satisfies Leaderboard;
