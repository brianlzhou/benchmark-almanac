// ASAG2024 evaluates automatic short-answer grading. Table 2 gives weighted root mean square
// error for each of seven datasets and the authors' mean across them. Lower is better.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2409.18596';
const subsets=['Beetle','CU-NLP','DigiKlausur','Mohler','SAF','SciEntsBank','Stita'];
const board:Leaderboard={
  benchmark:'asag2024',static:'paper',url,feed:url,terms:PAPER_TERMS,
  aliases:{'GPT-4o (snapshot unspecified)':'gpt-4o-may-2024','GPT-3.5-turbo (snapshot unspecified)':'gpt-3-5-turbo-jan-2024',
    'Llama3-8B':'llama-3-8b'},
  parts:Object.fromEntries(subsets.map(name=>[name.replace('-',''),{name,unit:'score',better:'lower'}])),
  async fetch(){
    const t=paperTables(await paperHtml(url)).map(grid).find(t=>t[0]?.slice(0,3).join('|')==='Dataset|Baseline|Nomic-embed-text');
    if(!t || t.map(r=>r[0]).join('|')!==['Dataset',...subsets,'Mean'].join('|')) throw new Error('Missing Table 2 rows');
    const rows=t[0].slice(2).map((model,j)=>{
      const scores=t.slice(1).map(r=>r[j+2]);
      if(scores.some(v=>!/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Missing wRMSE for '+model);
      return {model,score:Number(scores.at(-1)),metrics:Object.fromEntries(subsets.map((s,i)=>[s.replace('-',''),Number(scores[i])]))};
    });
    return checked(rows,6);
  },
};
export default board;
