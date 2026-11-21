// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// Full-Duplex-Bench v2 tests real-time spoken dialogue. The project site's results
// table gives turn-taking and instruction-following scores for four tasks at each pace.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://ericsunkuan.github.io/full-duplex-bench-v2-demo/';
const tasks = ['Daily','Correction','Entity Tracking','Safety'];
const names = tasks.flatMap(task=>['Turn-taking','Instruction-following'].map(metric=>task+': '+metric));
export default {
  benchmark:'full-duplex-bench-2',url:feed,feed,
  terms:'Results from the authors’ project page. https://ericsunkuan.github.io/full-duplex-bench-v2-demo/',
  headline:'The headline averages turn-taking and instruction-following scores across four tasks at the specified examiner pace.',
  parts:Object.fromEntries(names.map((name,i)=>['part'+i,name])),
  async fetch() {
    const t = paperTables(await fetchText(feed)).map(grid).find(t=>t[0].join('|') === ['System',...tasks.flatMap(x=>[x,x])].join('|')
      && t[1]?.join('|')==='System|TT|IF|TT|IF|TT|IF|TT|IF');
    if(!t) throw new Error('Missing dialogue results table');
    let setting = '';
    const rows = [];
    for(const [model,...cells] of t.slice(2)) {
      if(model==='Fast Pacing' || model==='Slow Pacing') {setting=model;continue;}
      if(!setting || cells.length!==8) throw new Error('Incomplete dialogue scores');
      const values=cells.map(numberCell);
      rows.push({model,setting,score:values.reduce((a,b)=>a+b,0)/8,
        metrics:Object.fromEntries(values.map((value,i)=>['part'+i,value]))});
    }
    return checked(rows,6);
  },
} satisfies Leaderboard;
