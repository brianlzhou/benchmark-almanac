// CiteVQA strict answer-attribution accuracy (SAA) percentage. Recall, relevance and answer accuracy remain component metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/opendatalab/CiteVQA/raw/main/README.md";
const board: Leaderboard = {
 benchmark: "citevqa",
 url: "https://huggingface.co/datasets/opendatalab/CiteVQA",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('SAA'));
  if (!t) throw new Error('citevqa table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[5])!==undefined).map(r=>({
    model:r[0], score:num(r[5])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==5 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('citevqa has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
