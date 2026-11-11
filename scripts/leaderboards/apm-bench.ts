// APM-Bench overall capability percentage with memory configuration and three capability components from the official README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Jianguo-Huang11/APM-Bench/main/README.md";
const board: Leaderboard = {
 benchmark: "apm-bench",
 url: "https://github.com/Jianguo-Huang11/APM-Bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Overall'))!;return t.slice(1).map(r=>({model:r[0],score:num(r[5])!,setting:'memory: '+r[1],metrics:{crossSessionUnderstanding:num(r[2])!,realTimePerception:num(r[3])!,adaptiveResponse:num(r[4])!}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
