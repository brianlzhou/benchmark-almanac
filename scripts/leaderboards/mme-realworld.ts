// MME-RealWorld: Overall Avg is the published accuracy percentage across the real-world questions.
// Perception and reasoning averages and task-specific accuracies remain diagnostic metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://mme-realworld.github.io/home_page.html";
const board: Leaderboard = {
 benchmark: "mme-realworld",
 url: "https://mme-realworld.github.io/home_page.html",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Overall') && t[0]?.some(c=>c.text==='Perception'));
  if(!t)throw new Error('MME-RealWorld table missing');
  return t.slice(3).filter(r=>num(r[4]?.text)!==undefined).map(r=>({
    model:text(r[1].html.split(/<p\b/)[0]),score:num(r[4].text)!,date:/^\d{4}-\d\d-\d\d$/.test(r[3].text)?r[3].text:undefined,
    metrics:Object.fromEntries(['perceptionOCR','perceptionRS','perceptionDT','perceptionMO','perceptionAD','perception','perceptionClassAverage','reasoningOCR','reasoningDT','reasoningMO','reasoningAD','reasoning','reasoningClassAverage'].map((h,i)=>[h,num(r[i+5]?.text)]).filter((p):p is [string,number]=>typeof p[1]==='number'))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
