// Maker-published paper results. Keep diagnostic scores in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2503.03750';
export default {
 benchmark:'mask', static: 'paper',url:'https://arxiv.org/abs/2503.03750',feed,terms:PAPER_TERMS,
 stats:{honest:{name:'Honesty rate',unit:'%',better:'higher'},accuracy:{name:'Accuracy',unit:'%',better:'higher'},honestAt10:{name:'Honesty at 10',unit:'%',better:'higher'},lieAt10:{name:'Lie rate at 10',unit:'%',better:'lower'}},
 aliases:{'grok-2-1212':'grok-2-dec-2024'},
 async fetch():Promise<LeaderboardRow[]> {
  const ts=flatPaperTables(await paperHtml(feed)).map(grid);
  const t=ts.find(t=>t[0]?.[2]==='P(lie) \\downarrow');
  if(!t)throw new Error('MASK full results table missing');
  return checked(t.slice(1).map(r=>{
   let model=r[0].replace(/\s*∗$/,'').replace(/llama-3([123])-/, 'llama-3.$1-').replace(/qwen(15|25)-/,(_,v)=>`qwen${v==='15'?'1.5':'2.5'}-`).replace('-05b-','-0.5b-').replace('-15b-','-1.5b-');
   const metrics:Record<string,number>={honest:num(r[1])!,accuracy:num(r[5])!};
   for(const [k,i] of [['honestAt10',3],['lieAt10',4]] as const){const n=num(r[i]);if(n!==undefined)metrics[k]=n;}
   const size = model.match(/-(\d+(?:\.\d+)?)b(?:-|$)/i);
   return {model,params:size ? Number(size[1]) : undefined,score:num(r[2])!,setting:r[0].includes('∗')?'low effort':undefined,metrics};
  }),3);
 },
} satisfies Leaderboard;
