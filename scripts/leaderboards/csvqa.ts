// CSVQA: Overall is accuracy in percent in the official dataset card.
// Subject scores and open-ended/multiple-choice accuracies remain metrics; random and category-heading rows are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/Skywork/CSVQA/raw/main/README.md";
const board: Leaderboard = {
 benchmark: "csvqa",
 url: "https://huggingface.co/datasets/Skywork/CSVQA",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Overall'));
  if (!t) throw new Error('csvqa table missing');
  const rows=t.slice(1).filter(r=>r[0]?.text && !/human|random/i.test(r[0].text) && num(r[1]?.text)!==undefined).map(r=>({
    model:r[0].text,score:num(r[1].text)!,
    metrics:Object.fromEntries(t[0].map((h,i)=>[h.text,i!==0 && i!==1?num(r[i]?.text):undefined]).filter((p):p is [string,number]=>typeof p[1]==='number'))
  }));
  if(!rows.length) throw new Error('csvqa has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
