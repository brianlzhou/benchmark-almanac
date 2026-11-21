// AgroBench tests agricultural knowledge across seven question types. Tables 2 and 3
// report overall accuracy as the average of the task accuracies with and without images.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2507.20519';
const parts = {DID:'Disease identification', DMN:'Disease management', PID:'Pest identification', WID:'Weed identification',
  CMN:'Crop management', MQA:'Machine QA', TM:'Traditional methods'};
const board: Leaderboard = {
  benchmark:'agrobench', static:'paper', url:feed, feed, parts,
  terms:'The authors publish Tables 2 and 3 on arXiv. https://arxiv.org/abs/2507.20519',
  aliases:{'GPT-4o (snapshot unspecified)':'gpt-4o-aug-2024','GPT-4o mini (snapshot unspecified)':'gpt-4o-mini','EMU2Chat':'emu2-chat',
    'Gemini1.5-Flash (snapshot unspecified)':'gemini-1-5-flash-may-2024', 'Gemini1.5-Pro (snapshot unspecified)':'gemini-1-5-pro-may-2024',
    'LLaVa-7B':'llava-v1-5-7b','LLaVA-13B':'llava-v1-5-13b'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const images of [true,false]) {
      const header = [images ? 'Model' : '',...Object.keys(parts),'Overall',...(images ? ['Overall'] : [])];
      const table = tables.find(t => t[0].join('|') === header.join('|'));
      if (!table || (images && table[1][8] !== '(all)')) throw new Error('Missing agricultural task scores');
      for (const cells of table.slice(images ? 2 : 1)) {
        if (['Random Choice','Human'].includes(cells[0]) || cells[0] === cells[1]) continue;
        const metrics = Object.fromEntries(Object.keys(parts).map((k,i) => [k,numberCell(cells[i+1])]));
        if (images) metrics.humanValidationSubset = numberCell(cells[9]);
        rows.push({model:cells[0],score:numberCell(cells[8]),setting:images ? 'With images' : 'Text only',metrics});
      }
    }
    return checked(rows,14);
  },
};
export default board;
