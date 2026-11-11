// CG-Bench: long-video MCQ accuracy is the headline percentage, distinct from clue-only accuracy.
// Grounding, credibility and open-ended scores remain metrics, with both frame budgets retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://cg-bench.github.io/leaderboard/";
const board: Leaderboard = {
 benchmark: "cg-bench",
 url: "https://cg-bench.github.io/leaderboard/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[1]?.some(c=>c.text==='long-acc.'));
  if(!t)throw new Error('CG-Bench leaderboard missing');
  return t.slice(2).filter(r=>num(r[6]?.text)!==undefined).map(r=>({model:r[1].text,score:num(r[6].text)!,
    setting:`long MCQ; params=${r[2].text}; clue frames=${r[3].text}; long frames=${r[4].text}`,
    metrics:Object.fromEntries(['clueAccuracy','longAccuracy','mIoU','recallAtIoU','accuracyAtIoU','CRR','openEndedAccuracy'].map((h,i)=>[h,num(r[i+5]?.text)]).filter((p):p is [string,number]=>typeof p[1]==='number'))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
