// Official board's Overall is precision. Recall, F1 and source-benchmark scores are metrics.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/McGill-NLP/agent-reward-bench-leaderboard/raw/main/results.jsonl';
const board:Leaderboard={benchmark:'agent-reward-bench', parts: {
  AB: { name: 'AssistantBench', group: 'Split' },
  VWA: { name: 'VisualWebArena', group: 'Split' },
  WA: { name: 'WebArena', group: 'Split' },
  Work: { name: 'WorkArena', group: 'Split' },
  'Work++': { name: 'WorkArena++', group: 'Split' },
},url:'https://huggingface.co/spaces/McGill-NLP/agent-reward-bench-leaderboard',feed:FEED,
 terms:'Apache-2.0 Space; Hugging Face robots.txt permits this public raw results path.',
 async fetch(){
  const data=(await fetchText(FEED)).trim().split(/\r?\n/).map(l=>JSON.parse(l) as Record<string,unknown>);
  const rows=data.filter(r=>r.Judge!=='Rule-based').map(r=>{
   const name=String(r.Judge); const agent=name.match(/^(AER-C|AER-V|NNetNav|WebJudge) \((.+)\)$/);const mode=name.match(/^(.*) \(([AS])\)$/);
   return {model:agent?agent[2]:mode?mode[1]:name,harness:agent?.[1],setting:mode?.[2],score:Number(r.Overall),metrics:Object.fromEntries(['Recall','F1','AB','VWA','WA','Work','Work++'].map(k=>[k,Number(r[k])]))};
  });
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid overall rows');return rows;
 }};export default board;
