// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// DecepEval tests whether agents deceive users. Table 3 reports deception rates under neutral and induced conditions.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.07967';
const board: Leaderboard = {
  benchmark:'decepeval',static:'paper',url,feed:url,terms:PAPER_TERMS,
  aliases:{'Deepseek v4-Pro':'deepseek-v4-pro-0813'},
  headline:'The paper reports no overall deception rate. The headline averages its three task-family rates. Lower values indicate less deception.',
  parts:Object.fromEntries(['Tool-use','Coding','Long-horizon'].map(name=>[name,{name,unit:'%' as const,better:'lower' as const}])),
  async fetch(){
    const table = paperTables(await paperHtml(url)).map(grid).find(t=>t[0]?.join('|')==='Models|Tool-use|Tool-use|Tool-use|Coding|Coding|Coding|Long-horizon|Long-horizon|Long-horizon' &&
      t[1]?.slice(1).join('|')===Array(3).fill('Neutral|Induced|\\Delta p').join('|'));
    if (!table) throw new Error('Missing DecepEval deception rates');
    const rows=table.slice(2).flatMap(([model,...cells])=>['Neutral','Induced'].map((setting,i)=>{
      const metrics=Object.fromEntries(['Tool-use','Coding','Long-horizon'].map((name,j)=>{
        const value=cells[j*3+i];
        if (!/^\d+(?:\.\d+)?\s*%$/.test(value)) throw new Error('Invalid rate for '+model);
        return [name,parseFloat(value)];
      }));
      return {model,setting,score:Object.values(metrics).reduce((sum,v)=>sum+v,0)/3,metrics};
    }));
    return checked(rows,18);
  },
};
export default board;
