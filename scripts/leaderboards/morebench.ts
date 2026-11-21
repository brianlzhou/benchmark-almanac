// MoReBench evaluates moral reasoning across 1,000 dilemmas. Tables 6 and 7 report
// the weighted Regular score and length-controlled Hard score for traces and final responses.
// Tables 2 and 8 break down the proportion of criteria satisfied in five dimensions.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2510.16380';
const board: Leaderboard = {
  benchmark: 'morebench', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2510.16380.',
  aliases: {
    'Qwen3-235B-A22B-Thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
  },
  parts: {
    daily: 'Daily', aiRisk: 'AIRisk', expert: 'Expert', original: 'Original', extended: 'Extended',
    advisor: 'Advisor', agent: 'Agent', recall: { name: 'Identifying Recall', unit: '%' },
    clear: { name: 'Clear Process', unit: '%' }, logical: { name: 'Logical Process', unit: '%' },
    helpful: { name: 'Helpful Outcome', unit: '%' }, harmless: { name: 'Harmless Outcome', unit: '%' },
  },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const rows = [];
    for (const trace of [true, false]) {
      const table = tables.find(t => t[0][1] === 'Dilemma Source' && (trace ? t[1]?.[8] === 'Regular' : t[0][8] === 'MoReBench -Regular'));
      const dimensions = tables.find(t => t[0][1] === (trace ? 'Identifying' : 'Identify') && t[1]?.[5] === 'Harmless');
      if (!table || !dimensions || table[1].slice(1,8).join() !== 'Daily,AIRisk,Expert,Original,Extended,Advisor,Agent' ||
          dimensions[1].slice(1).join() !== 'Recall,Clear,Logical,Helpful,Harmless') throw new Error('Missing MoReBench columns');
      for (const r of table.slice(2)) {
        if (r[0] === 'Average' || !r[1] || r[0] === r[1]) continue;
        const raw = r[0];
        const isQwen = /^\d+B-A/.test(raw);
        const dim = dimensions.find(d => d[0].toLowerCase() === (isQwen ? 'Qwen3-' + raw : raw).toLowerCase());
        if (!dim) throw new Error('Missing dimensions for ' + raw);
        const model = isQwen ? 'Qwen3-' + raw + '-Thinking-2507' : raw.replace(/-high$/, '');
        const setting = (trace ? 'Thinking trace' : 'Final response') + (raw.endsWith('-high') ? ', high reasoning effort' : '');
        const keys = ['daily','aiRisk','expert','original','extended','advisor','agent'];
        const metrics = Object.fromEntries(keys.map((key, i) => [key, numberCell(r[i + 1])]));
        ['recall','clear','logical','helpful','harmless'].forEach((key, i) => { metrics[key] = numberCell(dim[i + 1]); });
        metrics.lengthChars = numberCell(r[9]);
        metrics.hard = numberCell(r[10]);
        rows.push({ model, setting, score: numberCell(r[8]), metrics });
      }
    }
    return checked(rows, 28);
  },
};
export default board;
