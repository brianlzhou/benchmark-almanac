// BizAgentBench tests payment-service agents across 50 tasks. Strict success requires goal,
// process and protection checks to all pass. Table 1 reports strict success in percent.
// Tables 2 and 3 report alternative conditions for DeepSeek-V4.1-Flash on the same tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://arxiv.org/html/2610.20424';
const board: Leaderboard = {
  benchmark: 'bizbench-ant', static: 'paper', url, feed: url,
  terms: 'Paper license and authors at https://arxiv.org/abs/2610.20424.',
  parts: { goal:'Goal', process:'Process', protection:'Protection', intermediateFailure:{name:'Intermediate failure',better:'lower'} },
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === 'Model|Goal (G)|Process (P)|Protection (F)|IF (\\neg(P\\land F))|Strict (G\\land P\\land F)');
    if (!table) throw new Error('Missing Table 1');
    const rows: LeaderboardRow[] = table.slice(1).map(c => {
      if (c.length !== 6) throw new Error('Missing strict success');
      const [goal,process,protection,intermediateFailure,score] = c.slice(1).map(numberCell);
      return { model:c[0], score, metrics:{goal,process,protection,intermediateFailure},
        trials: ['Claude Opus 5','Muse Spark 1.3'].includes(c[0]) ? 1 : 3 };
    });
    for (const key of ['Information condition','Tool-call cap']) {
      const t = tables.find(t => t[0]?.join('|') === key+'|Strict (%)');
      if (!t || t.length !== (key === 'Tool-call cap' ? 5 : 4)) throw new Error('Missing '+key+' conditions');
      for (const [condition,value] of t.slice(1)) {
        if (['Default condition','No cap'].includes(condition)) continue;
        const setting = key === 'Tool-call cap' ? condition.split('\\')[0]+' times the reference tool-call count' : condition.replace(/^\+ /,'');
        rows.push({model:'DeepSeek-V4.1-Flash', score:numberCell(value), trials:3, setting});
      }
    }
    return checked(rows,15);
  },
};
export default board;
