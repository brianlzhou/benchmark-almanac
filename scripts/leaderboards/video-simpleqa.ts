// Video SimpleQA: the leaderboard ranks by F-score, expressed as a percentage.
// Correctness, abstention, conditional correctness and four category F-scores remain available as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://videosimpleqa.github.io/";
const board: Leaderboard = {
 stats: { llmParamsB: { name: 'LLM parameters', unit: 'billions' }, correct: { name: 'Correct answers', unit: '%', better: 'higher' }, incorrect: { name: 'Incorrect answers', unit: '%', better: 'lower' }, notAttempted: { name: 'Not attempted', unit: '%', better: 'lower' }, correctGivenAttempted: { name: 'Correct given attempted', unit: '%', better: 'higher' }, fScore: { name: 'F score', unit: '%', better: 'higher' } },
 benchmark: "video-simpleqa",
 parts: {
   engineering: { name: 'Engineering', group: 'Domain' },
   nature: { name: 'Nature', group: 'Domain' },
   socialCultureArts: { name: 'Social culture and arts', group: 'Domain' },
   societyActivities: { name: 'Society activities', group: 'Domain' },
 },
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
    date:/^\d{4}-\d{2}$/.test(r[3].text) ? r[3].text+'-01' : undefined,
    params:/^\d+(?:\.\d+)?B$/i.test(r[2].text) ? Number.parseFloat(r[2].text) : undefined,
    metrics:{...(/^\d+(?:\.\d+)?B$/i.test(r[2].text) ? {llmParamsB:Number.parseFloat(r[2].text)} : {}), ...Object.fromEntries(['correct','incorrect','notAttempted','correctGivenAttempted','fScore','engineering','nature','socialCultureArts','societyActivities'].map((h,i)=>[h,num(r[i+4].text)!]))}
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
