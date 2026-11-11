// FoodTruck Bench ranks models by median-run net worth in dollars. The live page serializes the full model list behind its initial ten visible rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://foodtruckbench.com/";
const board: Leaderboard = {
 benchmark: "foodtruck-bench",
 url: "https://foodtruckbench.com",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases: {
  'Muse Glimmer 30B': 'muse-glimmer',
  'Nemotron-3 Ultra 550B': 'nemotron-3-ultra',
  'Nemotron-3 Super 120B': 'nemotron-3-super',
  'Qwen 3.8 27B NVFP4': 'qwen-3-8-27b',
 },

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const html=await fetchText(FEED);const stream=[...html.matchAll(/self\.__next_f\.push\((\[1,[\s\S]*?\])\)<\/script>/g)].map(m=>JSON.parse(m[1])[1]).join('');const models=jsonAfter<any[]>(stream,'"models":');if(!models)throw new Error('FoodTruck models missing');
return models.filter(r=>r.display_name&&typeof r.median_net_worth==='number').map(r=>({model:r.display_name,score:Math.round(r.median_net_worth),setting:'median run; 30 days',metrics:{netWorthUnrounded:r.median_net_worth,runs:r.total_runs,revenue:r.median_revenue,profit:r.median_profit,foodWaste:r.median_food_waste,roi:r.median_roi}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, setting: / NVFP4$/.test(r.model) ? `${r.setting}; NVFP4` : r.setting, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
