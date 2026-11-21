// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// EVF-Bench evaluates visual effects in product videos. Table III reports six dimensions
// on a percentage-style scale, with higher values indicating better performance.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2611.24116';
const names = ['AesScore','GmeScore','MotionX','ProductScore','TSScore','CRScore'];
export default {
  benchmark:'evf-bench', url:feed, feed, static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2611.24116',
  headline:'The paper reports six separate dimensions. The headline is their plain mean on the published 0 to 100 scale.',
  parts:Object.fromEntries(names.map(name=>[name,{name,unit:'%' as const}])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0][1] === 'Method' && t[0].slice(2).map(s=>s.replace('\\uparrow','')).join('|') === names.join('|'));
    if (!table) throw new Error('Missing EVF-Bench comparison columns');
    let type = '';
    return checked(table.slice(1).map(c => {
      if (c[0]) type = c[0];
      if (c.length !== 8 || !c.slice(2).every(v=>v.endsWith('%'))) throw new Error('Incomplete EVF-Bench scores');
      const values = c.slice(2).map(v=>numberCell(v.slice(0,-1)));
      return {model:c[1], score:values.reduce((a,b)=>a+b,0)/names.length,
        open:type === 'Open-source' ? true : type === 'Commercial' ? false : undefined,
        metrics:Object.fromEntries(names.map((key,i)=>[key,values[i]]))};
    }),10);
  },
} satisfies Leaderboard;
