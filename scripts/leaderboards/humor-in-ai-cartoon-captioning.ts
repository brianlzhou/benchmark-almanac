// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Table 3 compares generated cartoon captions to four groups of human captions.
// The headline uses Overall Win Rate. Best Pick Win Rate is a separate comparison.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.10522';
const groups = ['Top 10', '#200- #209', '#1000- #1009', 'Contestant Median'];
const keys = ['Overall Win Rate', 'Best Pick Win Rate'].flatMap(metric => groups.map(group => metric + ': ' + group));
export default {
  benchmark: 'humor-in-ai-cartoon-captioning', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2406.10522',
  headline: 'The paper reports four Overall Win Rates against human caption groups, so the headline is their plain mean.',
  parts: Object.fromEntries(keys.map(name => [name, {name, unit: '%' as const}])),
  aliases: {'Mistral-7B': 'mistral-7b-instruct-v0-1'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.[0] === 'Generated Caption Model');
    if (!table || table[1].slice(1).join('|') !== [...groups, ...groups].join('|') ||
        table[0].slice(1).some((cell, i) => !cell.startsWith(i < 4 ? 'Overall Win Rate' : 'Best Pick Win Rate'))) {
      throw new Error('Missing caption group win rates');
    }
    return checked(table.slice(2).map(([label, ...cells]) => {
      if (cells.length !== 8 || cells.some(c => !/^\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid win rates');
      const metrics = Object.fromEntries(keys.map((key, i) => [key, Number(cells[i])]));
      const [, model, setting] = label.match(/^(Mistral-7B|LLaVA|GPT-4o) (0-Shot|BoN|SFT|RLHF|DPO|Vision)$/) ?? ['', label];
      return {model, setting, score: cells.slice(0, 4).reduce((sum, c) => sum + Number(c), 0) / 4, metrics};
    }), 11);
  },
} satisfies Leaderboard;
