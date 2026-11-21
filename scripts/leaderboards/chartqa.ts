// ChartQA paper tables 5, 6, 10 and 11 give test and validation scores, chart types and sampled question types.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2203.10244';
export default {
  benchmark:'chartqa', static: 'paper', parts: {
  human: { name: 'Human written', group: 'Split' },
  ...Object.fromEntries(['Bar', 'Line', 'Pie'].map(name => [name, { name, group: 'Chart type' }])),
  ...Object.fromEntries(['Data Retrieval', 'Visual', 'Compositional', 'Visual Compositional'].map(name => [
    name, { name, group: 'Question type', note: 'Accuracy on a sample of 200 ChartQA-H questions.' },
  ])),
  generated: { name: 'Generated', group: 'Split' },
},url:'https://arxiv.org/abs/2203.10244',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Model|ChartQA-H|ChartQA-M|Overall');
    if(!t)throw new Error('ChartQA overall table missing');
    const rows: LeaderboardRow[]=t.slice(1).map(r=>({model:r[0].replace(/\s*[†⋆]/g,'').replace(/ Pretrained$/,''),setting:r[0].includes('†')?'no difference or ratio operations':r[0].includes('⋆')?'trained on PlotQA':r[0].endsWith('Pretrained')?'pretrained':'standard',score:num(r[3])!,metrics:{human:num(r[1])!,generated:num(r[2])!}}));
    for (const first of ['Bar', 'Data Retrieval']) {
      const table = ts.find(table => table[0]?.[1] === first);
      for (const cells of table?.slice(1) ?? []) {
        const row = rows.find(row => row.model === cells[0] && row.setting === 'standard');
        if (!row) continue;
        for (let col = 1; col < cells.length - 1; col++) {
          const value = num(cells[col]);
          if (value !== undefined) row.metrics![table![0][col]] = value;
        }
      }
    }
    const comparison = ts.find(table => table[0]?.[0] === 'Models' && table[0].at(-1) === 'ChartQA');
    let setup: string | undefined;
    for (const cells of comparison?.slice(2) ?? []) {
      if (cells[0].startsWith('Gold Data Table')) {
        setup = cells[0];
        continue;
      }
      const score = num(cells.at(-1)), validation = num(cells.at(-2));
      if (!setup || score === undefined) continue;
      const model = cells[0], standard = setup === 'Gold Data Table Not Provided';
      const existing = standard && rows.find(row => row.model === model && row.setting === 'standard' && row.score === score);
      const row = existing || { model, setting: standard ? 'standard' : setup, score, metrics: {} };
      if (validation !== undefined) row.metrics!.validation = validation;
      if (!existing) rows.push(row);
    }
    return checked(rows,3);
  },
} satisfies Leaderboard;
