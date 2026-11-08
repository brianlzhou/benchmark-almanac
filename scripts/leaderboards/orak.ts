// Orak: Avg.Rank is the leaderboard’s aggregate score, where lower ranks are better.
// Per-game mean scores and deviations remain metrics, and agentic strategy becomes the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://krafton-ai.github.io/orak-leaderboard/";
const board: Leaderboard = {
 benchmark: "orak",
 url: "https://krafton-ai.github.io/orak-leaderboard/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Model (Agentic Strategy)'));
  if(!t)throw new Error('Orak game table missing');
  return t.slice(1).filter(r=>num(r[1]?.text)!==undefined).map(r=>{
    const name=r[0].text.replace(/^[^A-Za-z0-9]+/u,''); const strategy=name.match(/\s*\(([^)]+)\)$/);
    return {model:strategy?name.slice(0,strategy.index):name,harness:strategy?.[1],score:num(r[1].text)!,
      metrics:Object.fromEntries(r.slice(2).flatMap((c,i)=>[[t[0][i+2].text,num(c.text)],[t[0][i+2].text+'Std',num(c.text.split('±')[1])]]).filter((p):p is [string,number]=>typeof p[1]==='number'))};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
