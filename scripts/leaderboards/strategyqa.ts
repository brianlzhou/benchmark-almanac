// StrategyQA: the authors link per-model evaluation JSON from their README. Accuracy is a fraction
// converted to percent on their unofficial development split, not the hidden test set.
// Unavailable archived configurations are omitted; BoolQ pretraining and decomposition scores are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/eladsegal/strategyqa/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "strategyqa",
 url: "https://github.com/eladsegal/strategyqa",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const source=await fetchText(FEED);const rows:LeaderboardRow[]=[];
  for(const line of source.split('\n')) {
    if(!line.includes('metrics (`data/strategyqa/')||!line.includes('RoBERTa'))continue;
    const model=line.match(/^\* \*\*(.*?)\*\*/)?.[1]?.replaceAll('\\*','*');
    const url=line.match(/https:\/\/storage\.googleapis\.com\/ai2i\/strategyqa\/models\/[^)\s]+\.json/)?.[0];
    if(!model||!url)continue;
    await new Promise(resolve=>setTimeout(resolve,1100));
    try {
      const r=await fetchJson<{accuracy?:number}>(url);
      if(typeof r.accuracy==='number')rows.push({model,score:r.accuracy*100,setting:'unofficial dev split'});
    }catch(error){if(!/\b40[34]\b/.test(String(error)))throw error;}
  }
  if(!rows.length)throw new Error('No accessible StrategyQA accuracy results');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
