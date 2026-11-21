// PrimeVul evaluates vulnerability classification. Tables V–VII report accuracy on the full PrimeVul test set,
// with F1, VD-S and four paired classification measures for each training configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2403.18624';
const board: Leaderboard = {
  benchmark: 'primevul', static: 'paper', url: 'https://arxiv.org/abs/2403.18624', feed, terms: PAPER_TERMS,
  aliases: { StarCoder2: 'starcoder-2-7b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const names: Record<string,string> = {CT5:'CodeT5', CB:'CodeBERT', UC:'UnixCoder', SC2:'StarCoder2', 'CG2.5':'CodeGen2.5'};
    const rows: LeaderboardRow[] = [];
    for (const [label, offset] of [['Model',3], ['Weight',1], ['Finetune',1]] as const) {
      const table = tables.find(t => t[0]?.[0] === label && t[0][offset]?.startsWith('Acc'));
      const keys = table?.[0].slice(offset).map(v => v.replace(/\s*\\(?:up|down)arrow$/, ''));
      if (!table || keys?.join('|') !== 'Acc|F1|VD-S|P-C|P-V|P-B|P-R') throw new Error('PrimeVul score columns changed');
      for (const cells of table.slice(1)) {
        if (label === 'Model' && cells[2] !== 'PV') continue;
        if ((label === 'Weight' && cells[0] === '1') || (label === 'Finetune' && cells[0] === 'CLS')) continue;
        const model = label === 'Model' ? names[cells[0]] : 'UnixCoder';
        if (!model || cells.length !== offset + keys.length) throw new Error('Incomplete PrimeVul row');
        const setting = label === 'Model' ? 'Fine-tuned on ' + (cells[1] === 'PV' ? 'PrimeVul' : 'BigVul') : 'PrimeVul, ' + label + ' ' + cells[0];
        rows.push({model, setting, score: numberCell(cells[offset]), metrics: Object.fromEntries(keys.slice(1).map((k,i) => [k,numberCell(cells[offset+1+i])]))});
      }
    }
    if (rows.length < 16) throw new Error('Missing PrimeVul configurations');
    return rows;
  },
};
export default board;
