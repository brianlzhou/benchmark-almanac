// The source reports no overall score. The headline is the plain mean of the 11 parts, computed by this importer.
// Table 2 reports instruction following, knowledge and robustness scores for voice chat models.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2510.11098';
const keys = ['TIF','TIF-En','SIF','SIF-En','MTD','GK','ML','DC','SV','EV','CV'];
const board: Leaderboard = {
  benchmark:'vcb-bench',static:'paper',url,feed:url,
  terms:'The authors publish the results under the license linked at https://arxiv.org/abs/2510.11098.',
  parts:Object.fromEntries(keys.map((name,i)=>[name,{name,group:i<5?'Instruction Following':i<8?'Knowledge':'Robustness'}])),
  headline:'The paper reports no overall score, so the headline is the plain mean of its eleven task scores.',
  async fetch() {
    const t = flatPaperTables(await paperHtml(url)).map(grid).find(t=>t[1]?.join('|')===['Model',...keys].join('|'));
    if (!t) throw new Error('Table 2 task scores missing');
    return checked(t.slice(2).filter(r=>!r.includes('/')).map(([label,...cells])=>{
      if (cells.length!==keys.length) throw new Error('Missing VCB score');
      const values = cells.map(numberCell);
      return {model:label.replace(/\s*\( [^()]* \)$/,''),score:values.reduce((a,b)=>a+b,0)/values.length,
        metrics:Object.fromEntries(keys.map((key,i)=>[key,values[i]]))};
    }),7);
  },
};
export default board;
