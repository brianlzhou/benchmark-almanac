// VLMs Are Blind: the static results table reports mean accuracy in percent across eight visual tasks.
// Model and task names come from image alt labels, not image recognition; random and aggregate rows are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://vlmsareblind.github.io/";
const board: Leaderboard = {
 benchmark: "vlms-are-blind",
 url: "https://vlmsareblind.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Model' && t[0]?.at(-1)?.text==='Mean');
  if(!t) throw new Error('VLMs Are Blind table missing');
  const label=(c:{html:string;text:string})=>c.html.match(/alt="([^"]+)"/)?.[1] ?? c.text;
  return t.slice(1).filter(r=>r[0].html.includes('<img') && num(r[9]?.text)!==undefined).map(r=>({
    model:label(r[0]),score:num(r[9].text)!,metrics:Object.fromEntries(r.slice(1,9).map((c,i)=>[label(t[0][i+1]),num(c.text)!]))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
