// CG-Bench: long-video MCQ accuracy is the headline percentage, distinct from clue-only accuracy.
// Keep rank, language-model size, frame budgets, grounding and open-ended measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://cg-bench.github.io/leaderboard/";
const board: Leaderboard = {
 benchmark: "cg-bench",
 url: "https://cg-bench.github.io/leaderboard/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: { clueAccuracy: { name: 'Clue accuracy', unit: '%', better: 'higher' }, mIoU: { name: 'Mean intersection over union', unit: '%', better: 'higher' }, recallAtIoU: { name: 'Recall at intersection over union', unit: '%', better: 'higher' }, accuracyAtIoU: { name: 'Accuracy at intersection over union', unit: '%', better: 'higher' }, CRR: { name: 'Correct response rate', unit: '%', better: 'higher' }, openEndedAccuracy: { name: 'Open-ended accuracy', unit: '%', better: 'higher' } },

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[1]?.some(c=>c.text==='long-acc.'));
  if(!t)throw new Error('CG-Bench leaderboard missing');
  return t.slice(2).filter(r=>num(r[6]?.text)!==undefined).map(r=>({model:r[1].text,score:num(r[6].text)!,
    params:/^\d+(?:\.\d+)?B$/i.test(r[2].text) ? parseFloat(r[2].text) : undefined,
    setting:`long MCQ, params=${r[2].text}, clue frames=${r[3].text}, long frames=${r[4].text}`,
    metrics:Object.fromEntries(([['clueAccuracy',5],['mIoU',7],['recallAtIoU',8],['accuracyAtIoU',9],['CRR',10],['openEndedAccuracy',11]] as const).map(([h,i]):[string,number|undefined]=>[h,num(r[i]?.text)]).filter((p):p is [string,number]=>typeof p[1]==='number'))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
