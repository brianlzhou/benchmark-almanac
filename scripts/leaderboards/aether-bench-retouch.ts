// Aether-Bench evaluates automatic, style-guided, and parameter-guided photo retouching.
// Table 2 starts with Auto Hist-M, the percentage histogram consistency score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2604.27375';
const board: Leaderboard = {
  benchmark: 'aether-bench-retouch', static: 'paper', url: feed, feed, parts: {},
  terms: 'The authors publish Table 2 on arXiv. https://arxiv.org/abs/2604.27375',
  aliases: {'Qwen-Image-2509': 'qwen-image-edit-2509'},
  headline: 'The paper reports separate metrics for three tasks. The headline is Auto Hist-M, the first metric.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.[0] === 'Aether-Bench (Auto)');
    if (!table || !table[2][2].startsWith('Hist-M')) throw new Error('Missing Auto Hist-M');
    const rows = new Map<string, LeaderboardRow>();
    for (const group of ['Auto', 'Style', 'Param']) {
      const start = table.findIndex(c => c[0] === 'Aether-Bench (' + group + ')');
      if (start < 0) throw new Error('Missing Aether-Bench task: ' + group);
      const headers = table[start+1].slice(2);
      for (const cells of table.slice(start+2)) {
        if (cells[0].startsWith('Aether-Bench (')) break;
        const model = cells[0].replace(/^Ours-/, 'VeraRetouch-');
        const row: LeaderboardRow = rows.get(model) ?? {model,score:NaN,metrics:{}};
        headers.forEach((header,i) => {
          const name = header.split('\\')[0].replace('L_{1}','L1');
          const key = group.toLowerCase() + name.replace(/[^a-zA-Z0-9]/g,'');
          const value = numberCell(cells[i+2].replace('%',''));
          board.parts![key] = {name, group, unit: name === 'Hist-M' ? '%' : 'score', better: header.endsWith('downarrow') ? 'lower' : 'higher'};
          row.metrics![key] = value;
          if (key === 'autoHistM') row.score = value;
        });
        rows.set(model,row);
      }
    }
    return checked([...rows.values()],8);
  },
};
export default board;
