// AV-SafetyBench tests the safety of generated audiovisual clips. The project site's
// Full-AV Unsafe Rate table gives category rates and the average for each model and judge.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://miko-mitama.github.io/av-safetybench/';
const board: Leaderboard = {
  benchmark:'av-safetybench', url:feed, feed, parts:{},
  terms:'The authors publish their Full-AV Unsafe Rate table on the project site. ' + feed,
  async fetch() {
    const t = tables(await fetchText(feed)).map(grid).find(t => t[0][0] === 'Category' && t[1].includes('Gemini') && t[1].includes('Human'));
    if (!t || t.at(-1)?.[0] !== 'Average' || t.length !== 16) throw new Error('Missing AV-SafetyBench categories or average');
    const averages = t.at(-1)!;
    const rows = t[1].flatMap((judge,i) => {
      if (!['Gemini','Human'].includes(judge)) return [];
      const metrics: Record<string,number> = {};
      for (const cells of t.slice(2,-1)) {
        const name = cells[0].replace(/^\d+\.\s*/,'');
        const key = name.toLowerCase().replace(/[^a-z0-9]+/g,'_');
        board.parts![key] = name;
        if (!/^\d+\.\d+$/.test(cells[i])) throw new Error('Missing category percentage');
        metrics[key] = Number(cells[i]);
      }
      return [{model:t[0][i],setting:judge+' judgments',score:Number(averages[i]),metrics}];
    });
    return checked(rows,10);
  },
};
export default board;
