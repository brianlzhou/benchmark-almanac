// AndroidArena tests whether agents complete Android tasks and respect constraints. Table 3 reports
// success and trajectory measures, while Table 5 reports lower-is-better violation rates. No common
// overall score exists. Use the success rate for the first task group and retain both tables.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url='https://arxiv.org/html/2402.06596';
const labels=['TR','TCR','RRR','SR'];
const violations=['APP-level','Page-level','Component-level'];
const board:Leaderboard={
  benchmark:'androidarena',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The benchmark reports separate completion and constraint metrics, so this is the single-app task success rate.',
  parts:{...Object.fromEntries(['Single-APP Tasks','Cross-APP Tasks'].flatMap((group,i)=>labels.map(name=>['task'+i+name,{name,group,unit:'%'}]))),
    ...Object.fromEntries(violations.map((name,i)=>['violation'+i,{name,group:'Constraint violation rate',unit:'%',better:'lower' as const}]))},
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const main=ts.find(t=>t[1]?.join('|')===['Model',...labels,...labels].join('|'));
    const constraints=ts.find(t=>t[0]?.join('|')===['Model',...violations].join('|'));
    if (!main || !constraints) throw new Error('Missing Android task tables');
    const rows=main.slice(2).map(([model,...values])=>{
      if (values.length!==8) throw new Error('Missing task metrics');
      const metrics:Record<string,number> = Object.fromEntries(values.map((v,i)=>['task'+Math.floor(i/4)+labels[i%4],100*Number(v)]));
      const constraint=constraints.find(r=>r[0]===model);
      constraint?.slice(1).forEach((v,i)=>metrics['violation'+i]=100*Number(v));
      if(!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid task rate');
      return {model,score:metrics.task0SR,metrics};
    });
    return checked(rows,4);
  },
};
export default board;
