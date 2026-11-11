// CoVEBench Union Accuracy Score (UAS) from the official video-editing leaderboard, with all component metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://nju-link.github.io/CoVEBench/";
const board: Leaderboard = {
 benchmark: "covebench",
 url: "https://nju-link.github.io/CoVEBench/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = tables(await fetchText(FEED)).find(t=>t[0].some(c=>c.text==='UAS'));
  if (!t) throw new Error('covebench table missing');
  const rows=t.slice(1).filter(r=>r[1]?.text && !/human|random/i.test(r[1].text) && num(r[3]?.text)!==undefined).map(r=>({
    model:r[1].text,score:num(r[3].text)!,
    metrics:Object.fromEntries(t[0].map((h,i)=>[h.text,i!==1 && i!==3?num(r[i]?.text):undefined]).filter((p):p is [string,number]=>typeof p[1]==='number'))
  }));
  if(!rows.length) throw new Error('covebench has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
