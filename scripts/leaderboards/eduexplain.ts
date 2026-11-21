// EduExplain tests retrieval of complementary educational resources. Table 6 reports
// GoldSet F1 for all 321 questions under four selection strategies with K=100 and n=3.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2611.00802';
function rate(v:string){
  if(!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(v)) throw new Error('Invalid EduExplain rate '+v);
  return Number(v);
}
const board:Leaderboard={
  benchmark:'eduexplain',static:'paper',url,feed:url,terms:PAPER_TERMS,
  parts:{recall:'Recall@100',att:'Attainment',coreCC:'Core Concept Coverage'},
  async fetch(){
    const t=paperTables(await paperHtml(url)).map(grid).find(t=>t[2]?.join('|')===
      'Retriever|Recall@K|'+Array(4).fill('GS-F1|Att|Core CC').join('|'));
    if(!t || t[1].length!==14) throw new Error('Missing EduExplain explanation-set results');
    const rows=t.slice(3).flatMap(([label,recall,...cells])=>[0,1,2,3].map(i=>{
      const [score,att,coreCC]=cells.slice(3*i,3*i+3).map(rate);
      if(cells.length!==12) throw new Error('Incomplete selector metrics');
      const model=({'Dense retrieval (BGE-M3)':'BGE-M3','Multimodal retrieval (OpenCLIP)':'OpenCLIP',
        'Dense + cross-encoder reranking':'BGE-M3'} as Record<string,string>)[label]??label;
      const setting=t[1][2+3*i].replace('Top- n','Top-n');
      return {model,setting,score,...(label==='Dense + cross-encoder reranking'?{harness:'Cross-encoder reranking'}:{}),
        metrics:{recall:rate(recall),att,coreCC}};
    }));
    return checked(rows,16);
  },
};
export default board;
