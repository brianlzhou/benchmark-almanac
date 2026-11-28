// Ai2's own Tulu 3 model card publishes the six-task safety average, not the overall capability average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://huggingface.co/allenai/Llama-3.1-Tulu-3-70B/raw/main/README.md';
export default {
 benchmark:'tulu-3-safety-eval-ai2',url:'https://huggingface.co/allenai/Llama-3.1-Tulu-3-70B',feed,
 terms:'The public maker model card is readable under Hugging Face robots.txt. Its Llama 3.1 license governs the weights, which this importer does not download.',
 aliases:{'GPT 4o (11-24)':'gpt-4o-nov-2024','Tülu 3 8B':'llama-3-1-tulu-3-8b','Tülu 3 70B':'tulu-3-tulu-3-70b','Tülu 3 405B':'tulu-3-405b'},
 async fetch():Promise<LeaderboardRow[]> {
  const rows:LeaderboardRow[]=[];
  for(const t of markdownTables(await fetchText(feed))){
   const r=t.find(r=>r[0]==='Safety (6 task avg.)');if(!r)continue;
   for(let i=1;i<t[0].length;i++){
    const score=num(r[i]);if(score===undefined)throw new Error('Tulu safety score missing');
    rows.push({model:t[0][i],score,setting:'six-task safety average, model-card evaluation'});
   }
  }
  return checked(rows,3);
 },
} satisfies Leaderboard;
