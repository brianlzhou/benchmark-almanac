// scBench: current website scores are accuracy percentages from its live JSON export.
// Keep the current website cohort only. Older repository evaluations use another task set.
// Their costs and durations cannot be transferred to the website scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://benchmarks.bio/benchmarks/scbench/latest.json";
const board: Leaderboard = {
 benchmark: "scbench-latchbio-singlecellbench",
 url: "https://benchmarks.bio/scbench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const data=await fetchJson<{resultVersion:string;dataUpdatedAt:string;results:{model:string;harness:string;scorePct:number;modelVariant?:string|null}[]}>(FEED);
  const rows:LeaderboardRow[]=data.results.filter(r=>typeof r.scorePct==='number').map(r=>({model:r.model.replace(/\*$/,''),harness:r.harness,score:r.scorePct,
    setting:`published ${data.resultVersion}${r.modelVariant?'; '+r.modelVariant:''}`,date:data.dataUpdatedAt}));
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
