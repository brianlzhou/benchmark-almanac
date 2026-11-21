// Earth-Bench measures how accurately an agent answers Earth observation questions. Table 1
// reports final accuracy, efficiency, and trajectory metrics. Tables 8 to 10 provide modality scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2509.23141';
const metrics = ['Accuracy','Efficiency','Tool-Any-Order','Tool-In-Order','Tool-Exact-Match','Parameters'];
const names: Record<string,string> = {'LLaMA-4':'LLaMA-4-Maverick','Qwen3-Max':'Qwen3-Max-Preview','Gemini-2.5':'Gemini-2.5-Flash','Mistral':'Mistral-Large (snapshot unspecified)','Kimik2':'Kimi-K2'};
const board: Leaderboard = {
  benchmark: 'earth-bench', url: feed, feed, static: 'paper', reference: ['Earth-Agent'],
  terms: 'Results from the authors of Earth-Agent. https://arxiv.org/abs/2509.23141',
  aliases: {'Seed-1.6':'doubao-seed-1-6'},
  async fetch() {
    const html = await paperHtml(feed);
    const figures = [...html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)].map(m => ({
      caption: text(m[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] || ''), table: flatPaperTables(m[1]).map(grid)[0],
    }));
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    for (const subset of ['', 'Spectrum', 'Products', 'RGB']) {
      const phrase = subset ? 'on the ' + subset + ' subset' : 'different LLM backbones on Earth-Bench';
      const table = figures.find(f => f.caption.includes(phrase))?.table;
      const header = ['Model', ...metrics.flatMap(k => [k,k])].join('|');
      if (!table || table[0].join('|') !== header || table[1].slice(1).join() !== Array(6).fill('AP,IF').join()) throw new Error('Missing Earth-Bench results: ' + phrase);
      for (const [label, ...cells] of table.slice(2)) {
        if (cells.length !== 12) throw new Error('Missing Earth-Bench metric');
        const model = names[label] || label;
        for (const [i,setting] of ['Auto-planning','Instruction-following'].entries()) {
          const values = metrics.map((_,j) => numberCell(cells[2*j+i].replace(/\s*[↓↑]$/, '')));
          if (!subset) rows.push({model, setting, harness:'Earth-Agent', score:values[0], metrics: Object.fromEntries(metrics.slice(1).map((k,j) => [k,values[j+1]]))});
          else {
            const row = rows.find(r => r.model === model && r.setting === setting);
            if (!row) throw new Error('Unmatched modality result for ' + model);
            board.parts[subset] = {name: subset, unit:'%'};
            metrics.forEach((k,j) => {row.metrics![j === 0 ? subset : subset + ': ' + k] = values[j];});
          }
        }
      }
    }
    return checked(rows, 26);
  },
};
export default board;
