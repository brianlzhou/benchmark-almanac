// Original BTF-1 paper: weighted Brier scores averaged over ReAct and Fixed Evidence forecasters.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2506.21558';
export default {
 benchmark:'btf-1',url:'https://arxiv.org/abs/2506.21558',feed,terms:PAPER_TERMS,
 harnesses:'system',
 aliases:{'gemini-2.5-pro-preview-03-25':'gemini-2-5-pro-mar-2025','claude-3-5-sonnet-20241022':'claude-3-5-sonnet-october-2024'},
 async fetch():Promise<LeaderboardRow[]> {
  const ts=flatPaperTables(await paperHtml(feed)).map(grid);
  const t=ts.find(t=>t[0]?.join('|')==='Model 1|Model 2|Brier Score 1|Brier Score 2|p-value');
  const specs=ts.find(t=>t[0]?.join('|')==='Name|Reasoning Mode|Provider|Spec');
  if(!t||!specs)throw new Error('BTF-1 results or model specs missing');
  const scores=new Map<string,number>();
  for(const r of t.slice(1))for(const i of [0,1]){
   const score=num(r[i+2]);if(score===undefined)throw new Error('Invalid BTF-1 score');
   if(scores.has(r[i]) && scores.get(r[i])!==score)throw new Error('Inconsistent BTF-1 pairwise score');
   scores.set(r[i],score);
  }
  return checked([...scores].map(([name,score])=>{
   const spec=specs.find(r=>r[0]===name);if(!spec)throw new Error('BTF-1 model spec missing');
   return {model:spec[3],score,setting:spec[1],harness:'ReAct and Fixed Evidence forecasters (paper average)',metrics:{questions:299,effectiveQuestions:178.8}};
  }),3);
 },
} satisfies Leaderboard;
