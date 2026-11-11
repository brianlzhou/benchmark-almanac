// CRAB leaderboard completion-ratio percentage. Success rate is retained separately, with visual prompting and output structure kept as settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://crab.camel-ai.org/";
const board: Leaderboard = {
 benchmark: "crab-benchmark",
 url: "https://crab.camel-ai.org/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const t=tables(await fetchText(FEED))[0];return t.slice(1).map(r=>({model:r[1].text,score:num(r[2].text)!,setting:r[5].text+'; '+r[6].text,harness:'CRAB',metrics:{successRate:num(r[3].text)!}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
