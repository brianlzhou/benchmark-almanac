// GreekMMLU tests language models on Greek exam questions across 45 subjects.
// Tables 7 through 10 give average accuracy and subject group scores at zero and five shots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.05150';
const header = ['Model', 'STEM', 'Humanities', 'Social Sci.', 'Other', 'Average', 'Greek-specific'];
const board: Leaderboard = {
  benchmark: 'greekmmlu', url: feed, feed, static: 'paper',
  terms: 'The authors publish these tables under the terms linked at https://arxiv.org/abs/2602.05150.',
  aliases: {
    'Llama-2-7b-hf': 'llama-2-7b',
    'Mistral-Small-24B-Instruct-2501': 'mistral-small-3',
  },
  parts: { STEM: 'STEM', Humanities: 'Humanities', 'Social Sci.': 'Social Sciences', Other: 'Other', 'Greek-specific': 'Greek-specific' },
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const figure of html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)) {
      const caption = figure[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1].replace(/<[^>]+>/g, '');
      const match = caption?.match(/Overall (five|zero)-shot performance of (base|instruction-tuned) LLMs/i);
      if (!match) continue;
      const table = flatPaperTables(figure[1]).map(grid)[0];
      if (table?.[0]?.join('|') !== header.join('|')) throw new Error('GreekMMLU columns changed');
      for (const row of table.slice(1)) {
        if (row[0] === 'Random Baseline' || row.every(v => v === row[0])) continue;
        const metrics = Object.fromEntries([1, 2, 3, 4, 6].map(i => [header[i], numberCell(row[i])]));
        rows.push({ model: row[0], setting: match[1] + '-shot', score: numberCell(row[5]), metrics });
      }
    }
    return checked(rows, 147);
  },
};
export default board;
