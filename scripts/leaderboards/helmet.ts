// HELMET: Average is the published aggregate score on a 0-100 scale.
// Read the five published input lengths, seven task categories and parameter counts.
// Context-window capacity is a model specification, not a benchmark measurement or token count.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://princeton-nlp.github.io/HELMET/data/agg_results_128k.csv";
const board: Leaderboard = {
 benchmark: "helmet",
 parts: {
   Recall: { name: 'Recall', group: 'Task type' },
   RAG: { name: 'RAG', group: 'Task type' },
   ICL: { name: 'ICL', group: 'Task type' },
   Cite: { name: 'Generation with citations', group: 'Task type' },
   'Re-rank': { name: 'Re-ranking', group: 'Task type' },
   LongQA: { name: 'Long QA', group: 'Task type' },
   Summ: { name: 'Summarization', group: 'Task type' },
 },
 url: "https://princeton-nlp.github.io/HELMET/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const rows:LeaderboardRow[]=[];
  for(const size of ['128k', '64k', '32k', '16k', '8k']) {
    if(rows.length)await new Promise(resolve=>setTimeout(resolve,1100));
    for(const r of parseCsv(await fetchText(FEED.replace('128k.csv',size+'.csv')))) {
      const score=num(r.Average);if(!r.Model||score===undefined)continue;
      rows.push({model:r.Model,score,setting:`input=${size}`,
        params:num(r['# Params (B)']),
        metrics:Object.fromEntries(['Recall','RAG','ICL','Cite','Re-rank','LongQA','Summ'].filter(k=>num(r[k])!==undefined).map(k=>[k,num(r[k])!]))});
    }
  }
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
