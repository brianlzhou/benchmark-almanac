// LexGenius tests legal reasoning, knowledge and practice across seven dimensions.
// Table 2 gives the average percentage for each model with naive and chain-of-thought prompts.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {inlinePaperTables} from '../lib/boards/arxiv-inline-tables.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2512.04578';
const dims=['Legal Understanding','Legal Reasoning','Legal Application','Legal Ethics','Legal Language','Law and Society','Judicial Practice'];
const board:Leaderboard={
  benchmark:'lexgenius',static:'paper',feed,url:feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  parts:Object.fromEntries(dims.map(d=>[d,d])),
  async fetch(){
    const t=inlinePaperTables(await paperHtml(feed)).find(t=>t[0]?.[1]==='Legal Und.' && t[0]?.[15]==='Avg.' && t[1]?.[15]==='Nai.' && t[1]?.[16]==='CoT');
    if(!t) throw Error('Missing LexGenius overall table');
    const rows=t.slice(2).filter(r=>r[0]!=='Human').flatMap(r=>['Naive prompt','Chain of thought'].map((setting,i)=>{
      const values=[...dims,'Avg.'].map((_,j)=>r[1+2*j+i]).map(s=>s?.trim()?Number(s):NaN);
      if(!values.every(Number.isFinite)) throw Error('Invalid legal scores for '+r[0]);
      return {model:r[0],setting,score:values[7],metrics:Object.fromEntries(dims.map((d,j)=>[d,values[j]]))};
    }));
    return checked(rows,24);
  },
};
export default board;
