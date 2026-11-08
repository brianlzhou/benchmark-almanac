// Learn2Play normalized maximum performance and mean dollars per completed episode. Keep methods in harness and distinguish billed cost from estimates in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://liushiliushi.github.io/learn2play-bench-website/assets/performance-cost.json?v=astra-billed-150-20261008";
const board: Leaderboard = {
 benchmark: "learn2play-bench",
 url: "https://liushiliushi.github.io/learn2play-bench-website/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 chart:{title:'Performance versus episode cost',x:{key:'cost',label:'Mean cost per completed episode',unit:'$',better:'lower',log:true},y:{key:'score',label:'Normalized maximum',unit:'%',better:'higher'}},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d=await fetchJson<{points:any[];snapshot:string}>(FEED);return d.points.filter(p=>Number.isFinite(p.score)).map(p=>({model:p.model,score:p.score,harness:p.system,date:d.snapshot,cost:p.cost,metrics:{cost:p.cost,billedCost:p.costBasis==='billed'?1:0}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
