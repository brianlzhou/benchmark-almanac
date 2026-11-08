// EurekaBench final combined score from published row attributes, preserving reasoning effort, agent harness and scientific component scores. Human references are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://eurekabench.github.io/";
const board: Leaderboard = {
 benchmark: "eurekabench",
 url: "https://eurekabench.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const s=await fetchText(FEED);return [...s.matchAll(/<tr[^>]*data-model="([^"]+)"[^>]*data-harness="([^"]*)"[^>]*data-score="([^"]+)"[^>]*data-accuracy="([^"]+)"[^>]*data-insights="([^"]+)"[^>]*data-failures="([^"]+)"/g)].filter(m=>!/human/i.test(m[1])).map(m=>({model:m[1].replace(/\s*\([^)]*\)$/,''),score:Number(m[3]),setting:m[1].match(/\(([^)]*)\)$/)?.[1],harness:m[2],metrics:{predictiveAccuracy:Number(m[4]),scientificInsights:Number(m[5]),constraintFailures:Number(m[6])}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
