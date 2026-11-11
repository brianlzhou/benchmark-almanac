// The corrected PHYSICS-Verified card reports answer-level accuracy, distinct from the original problem-level protocol.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { markdownTables } from './github-markdown.ts';
import { num } from '../html.ts';
const URL='https://huggingface.co/datasets/yale-nlp/physics-verified';
export function physicsVerified(noFigures=false):Leaderboard {
 return {benchmark:'physics-yale-verified'+(noFigures?'-no-figures':''),url:URL,feed:URL+'/resolve/main/README.md',
 terms:'Official Yale NLP dataset card results; the dataset license applies and the Almanac credits and links the source.',
 async fetch(){
  const t=markdownTables(await fetchText(URL+'/resolve/main/README.md')).find(t=>t[0].includes('Test (all)'));
  if(!t)throw new Error('Verified test table missing');
  const column=t[0].indexOf(noFigures?'Test (no fig.)':'Test (all)'),rows:LeaderboardRow[]=[];
  for(const r of t.slice(1)){
   const score=num(r[column]);if(score===undefined)continue;
   const model=/^(DeepSeek-R1|gpt-4o|Gemini-2.5-Pro)$/i.test(r[0])?r[0]+' (snapshot unspecified)':r[0];
   rows.push({model,score,setting:r[2]==='yes'?'thinking':'no thinking'});
  }
  if(!rows.length)throw new Error('No PHYSICS-Verified scores');return rows;
 }};
}
