// MathCanvas-Bench: Complete is the all-requirements success percentage; Weighted is retained separately.
// The static table also provides eight mathematical topic scores, thinking mode and evaluation dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://mathcanvas.github.io/";
const board: Leaderboard = {
 benchmark: "mathcanvas-bench",
 url: "https://mathcanvas.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[1]?.some(c=>c.text==='Complete'));
  if(!t)throw new Error('MathCanvas table missing');
  return t.slice(2).filter(r=>num(r[6]?.text)!==undefined).map(r=>({model:r[1].text.replace(/[🥇🥈🥉]/gu,'').trim(),score:num(r[6].text)!,
    setting:`${r[5].text==='✓'?'thinking':'non-thinking'}; complete`,date:r[3].text,
    metrics:{weighted:num(r[7].text)!,...Object.fromEntries(r.slice(8).map((c,i)=>[t[0][i+7]?.text??'category'+i,num(c.text)]).filter((p):p is [string,number]=>typeof p[1]==='number'))}
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
