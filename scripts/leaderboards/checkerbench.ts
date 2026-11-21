// CheckerBench evaluates static-analysis checker synthesis. Table 2 reports Pass@1 over
// 300 tasks, averaged over three repeats. Table 21 reports Pass@1 by language.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.07557';
const languages = ['C/C++', 'Python', 'Go', 'Java', 'JavaScript'];
const board: Leaderboard = {
  benchmark: 'checkerbench', feed, url: feed, static: 'paper',
  terms: 'The authors publish the results under the terms linked at https://arxiv.org/abs/2610.07557.',
  parts: Object.fromEntries(languages.map(l => [l, {name: l, group: 'Language'}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.[0] === 'Model / System' && t[0][1]?.includes('Pass@1'));
    const splits = tables.find(t => t[0]?.join('|') === ['Model', ...languages].join('|'));
    if (!main || !splits || main[0].length !== 10 || !main[0][9].includes('Tool Calls')) throw new Error('Missing checker results');
    const rows: LeaderboardRow[] = [];
    let harness = '';
    for (const c of main.slice(1)) {
      if (c.every(cell => cell === c[0])) { harness = c[0]; continue; }
      if (c[0].includes('Average')) continue;
      const values = c.slice(1).map(value => numberCell(value.split(' ')[0]));
      const metrics = Object.fromEntries(['build', 'differentialSuccess', 'falsePositives', 'warningCount',
        'process', 'semantic', 'steps', 'toolCalls'].map((key,i) => [key, values[i+1]]));
      rows.push({model: c[0], harness, trials: 3, score: values[0], metrics});
    }
    for (const c of splits.slice(1)) {
      if (c.every(cell => cell === c[0])) { harness = c[0]; continue; }
      const row = rows.find(r => r.harness === harness && r.model === c[0]);
      if (!row) throw new Error('Unknown language result');
      languages.forEach((lang,i) => { row.metrics![lang] = numberCell(c[i+1]); });
    }
    return checked(rows, 21);
  },
};
export default board;
