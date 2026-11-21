// OmniMatBench tests materials reasoning across 19 subfields. Table 3 reports overall performance across rubric-scored
// answers and calculation slots. Tables 4, 7, 8, and 10 identify the components, subfields, and reference prices.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.29833';
const board: Leaderboard = {
  benchmark: 'omnimatbench', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2605.29833.',
  parts: {},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.at(-1) === 'Avg. score');
    const cal = tables.find(t => t[1]?.length === 21 && t[1].at(-1) === 'Avg.');
    const qa = tables.find(t => t[0]?.[1] === 'FMS' && t[1]?.at(-1) === 'F1');
    const labels = tables.find(t => t[0]?.join('|') === 'ID|Category|QA|CAL|Total');
    const prices = tables.find(t => t[0]?.join('|') === 'Model|Input|Output');
    if (!main || !cal || !qa || !labels || !prices) throw new Error('Missing OmniMatBench comparison');
    const rows: LeaderboardRow[] = main.slice(2).map(r => {
      const model = r[0], calc = cal.find(x => x[0] === model), answer = qa.find(x => x[0] === model);
      if (!calc || !answer || r.length !== 21) throw new Error('Missing component for ' + model);
      const metrics: Record<string,number> = {cal: numberCell(calc[20]), qa: numberCell(answer[15])};
      board.parts!.cal = 'CAL slot accuracy';
      board.parts!.qa = 'QA macro F1';
      for (let j = 1; j <= 19; j++) {
        const name = labels.find(x => x[0] === main[1][j])?.[1];
        if (!name || cal[1][j] !== main[1][j]) throw new Error('Missing subfield ' + j);
        const key = 'subfield' + j;
        board.parts![key] = {name, group: main[0][j]};
        metrics[key] = numberCell(r[j]);
        metrics[key + 'Cal'] = numberCell(calc[j]);
      }
      for (let j = 1; j < answer.length; j++) metrics[qa[0][j] + qa[1][j]] = numberCell(answer[j]);
      const price = prices.find(x => x[0] === model);
      if (price) {
        metrics.priceIn = numberCell(price[1]);
        metrics.priceOut = numberCell(price[2]);
      }
      return {model, score: numberCell(r[20]), metrics};
    });
    return checked(rows, 13);
  },
};
export default board;
