// Omnilingua-Bench has several tracks with incompatible metrics. The LongQA track's
// paper ranks models by accuracy on 5,038 questions. Tables 2 and 15 give scores and intervals.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const url='https://arxiv.org/html/2609.23416';
const names=['Semantic','Acoustic','Factual','Reasoning','Temporal','Long-range'];
const board:Leaderboard={
  benchmark:'omnilingua-bench',static:'paper',url,feed:url,
  terms:'The track authors publish results under the license linked at https://arxiv.org/abs/2609.23416.',
  headline:'The headline is accuracy on the LongQA (MuLA-Bench) track. The suite reports no overall score.',
  parts:Object.fromEntries(names.map((n,i)=>[n,{name:n,group:i<2?'LongQA evidence':'LongQA task',unit:'%'}])),
  stats:{correct:{name:'Correct LongQA responses',unit:'count'},coverage:{name:'Valid LongQA response coverage',unit:'%'}},
  async fetch(){
    const ts=flatPaperTables(await paperHtml(url)).map(grid);
    const main=ts.find(t=>t[1]?.join('|')==='Model|Overall|Sem.|Aco.|Factual|Reason.|Temporal|Long-range');
    const ci=ts.find(t=>t[0]?.join('|')==='Model|Correct / total|Accuracy (%)|95% CI');
    const cov=ts.find(t=>t[0]?.join('|')==='Model|Valid / total|Coverage (%)');
    if (!main || !ci || !cov) throw new Error('Missing LongQA results');
    return checked(main.slice(2).filter(r=>!r.every(x=>x===r[0])).map(([model,overall,...cells])=>{
      const key=(s:string)=>s.replace(/[ -]/g,'');
      const row=ci.find(r=>key(r[0])===key(model));
      const coverage=cov.find(r=>r[0]===model);
      const bounds=row?.[3].match(/^\[([\d.]+), ([\d.]+)\]$/);
      const count=row?.[1].match(/^([\d,]+) \/ 5,038$/);
      if (!bounds || !count || !coverage || row?.[2]!==overall || cells.length!==6) throw new Error('Incomplete LongQA row');
      return {model,score:numberCell(overall),low:Number(bounds[1]),high:Number(bounds[2]),
        metrics:{...Object.fromEntries(names.map((n,i)=>[n,numberCell(cells[i])])),
          correct:Number(count[1].replaceAll(',','')),coverage:numberCell(coverage[2])}};
    }),10);
  },
};
export default board;
