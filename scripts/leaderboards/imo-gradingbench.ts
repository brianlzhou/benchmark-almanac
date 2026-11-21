// IMO-GradingBench tests whether a model assigns the same grade to a mathematical proof as a human expert.
// Table 7 reports four-way classification accuracy and normalized mean absolute error.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2511.01846';

const board: Leaderboard = {
  benchmark: 'imo-gradingbench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2511.01846",
  parts:{mae:{name:'Mean absolute error',unit:'%',better:'lower'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table=tables.find(t=>t[0]?.[1]?.startsWith('Accuracy') && t[0]?.[2]?.startsWith('MAE'));
    if(!table) throw new Error('Missing IMO-GradingBench accuracy and MAE');
    const percent=(s:string)=>{if(!s.endsWith('%')) throw new Error('Expected a percentage');return numberCell(s.slice(0,-1));};
    const rows:LeaderboardRow[]=table.slice(1).map(([name,accuracy,mae])=>({
      model:name.replace(' ( high reasoning )','').replace('( IMO Gold )','(IMO Gold)'),
      setting:name.includes('high reasoning')?'High reasoning':undefined,
      score:percent(accuracy),metrics:{mae:percent(mae)},
    }));
    return checked(rows,5);
  },
};
export default board;
