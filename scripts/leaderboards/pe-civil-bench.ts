// PE Civil Bench tests language models on civil engineering exam problems and automated design.
// The headline score is overall accuracy across 150 exam problems under Agentic RAG.
// This importer reads the benchmark site's server-rendered results table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,num} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://komal-blkmmb.github.io/PE_CIVIL_BENCH/';
const board:Leaderboard={benchmark:'pe-civil-bench',url:URL,feed:URL,terms:'The benchmark site publishes these results. https://komal-blkmmb.github.io/PE_CIVIL_BENCH/',static:'paper',async fetch(){
 const ts=tables(await fetchText(URL));
 const t=ts.find(x=>x.some(r=>r.some(c=>c.text==='Agentic RAG')));
 if(!t) throw new Error('Agentic RAG results table missing');
 const rows:LeaderboardRow[]=[];
 for(const r of t){
  const cells=r.map(c=>c.text.trim());
  const model=cells[0];
  if(!model || /Models$|^Model$|MCQ|Open-Source|General-Purpose|Reasoning-Optimized|Base LLM|Vector RAG|Agentic RAG|^\s*$/.test(model)) continue;
  if(cells.length<10) continue;
  const score=num(cells[9]);
  const mcq=num(cells[7]);
  const oe=num(cells[8]);
  if(score===undefined || mcq===undefined || oe===undefined) continue;
  rows.push({model:model.replace(/\s+[★†].*$/,''),setting:'Agentic RAG',score,metrics:{mcq,oe}});
 }
 return checked(rows,10);
}};
export default board;
