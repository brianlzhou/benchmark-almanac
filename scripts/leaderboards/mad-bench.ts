// MAD-Bench tests whether models resist deceptive prompts about an image.
// Tables 2 and 3 give Meta Average accuracy and five category scores with the original and modified prompts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2402.13220';
const categories = ['Count of Object', 'Non-existent Object', 'Object Attribute', 'Scene Understanding', 'Text Recognition'];
const board: Leaderboard = {
  benchmark: 'mad-bench', static: 'paper', url: feed, feed,
  terms: 'Apple publishes these results under the terms at https://arxiv.org/abs/2402.13220.',
  parts: Object.fromEntries(categories.map(key => [key, key])),
  aliases: { 'Kosmos2': 'kosmos-2', 'mPLUG-Owl2': 'mplug-owl2-llama2-7b', 'MiniCPM-Llama3-v2.5': 'minicpm-llama3-v-2-5',
    'Phi-3-vision': 'phi-3-vision-128k-instruct', 'XComposer2-7b': 'internlm-xcomposer2-vl-7b',
    'LLaVA-NeXT-7b-vicuna': 'llava-v1-6-vicuna-7b', 'LLaVA-NeXT-13b-vicuna': 'llava-v1-6-vicuna-13b',
    'LLaVA-NeXT-34b': 'llava-v1-6-34b', 'Idefics-2-8b': 'idefics2-8b' },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(feed)).filter(t => t[0].at(-1) === 'Meta' && t[1]?.at(-1) === 'Average');
    if (tables.length !== 2) throw new Error('Missing MAD-Bench results tables');
    const rows: LeaderboardRow[] = [];
    for (const [index, table] of tables.entries()) {
      if (!categories.every((c, i) => c === table[0][i + 1] + ' ' + table[1][i + 1])) throw new Error('MAD-Bench categories changed');
      for (const [model, ...cells] of table.slice(2)) {
        if (['Open Source', 'Proprietary'].includes(model)) continue;
        const values = cells.map(c => {
          const match = c.match(/^(\d+(?:\.\d+)?)\s*%?(?:\s*\([+-]?[\d.]+%\))?$/);
          if (!match) throw new Error('Invalid MAD-Bench score ' + c);
          return Number(match[1]);
        });
        rows.push({ model: model.replace(/\s*\[.*?\]/g, ''), setting: index ? 'Modified prompt' : 'Original prompt',
          score: values[5], metrics: Object.fromEntries(categories.map((c, i) => [c, values[i]])) });
      }
    }
    return checked(rows, 24);
  },
};
export default board;
