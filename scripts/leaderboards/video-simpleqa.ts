// Video SimpleQA: the leaderboard ranks by F-score, expressed as a percentage.
// Correctness, abstention, conditional correctness and four category F-scores remain available as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://videosimpleqa.github.io/";
const board: Leaderboard = {
 benchmark: "video-simpleqa",
 url: "https://videosimpleqa.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[1]?.some(c=>c.text==='F-score'));
  if(!t) throw new Error('Video SimpleQA leaderboard missing');
  return t.slice(2).filter(r=>num(r[8]?.text)!==undefined).map(r=>({
    model:text(r[1].html.split(/<p\b/)[0]),score:num(r[8].text)!,
    setting:'source release month '+r[3].text,
    metrics:Object.fromEntries(['correct','incorrect','notAttempted','correctGivenAttempted','fScore','engineering','nature','socialCultureArts','societyActivities'].map((h,i)=>[h,num(r[i+4].text)!]))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
