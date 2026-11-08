// MMEB image leaderboard. Image-Overall is the percentage aggregate; embedding model identities and all category metrics remain intact.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard/resolve/main/rankings/image_ranking.csv";
const board: Leaderboard = {
 benchmark: "mmeb",
 url: "https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
return parseCsv(await fetchText(FEED)).filter(r=>r.Models&&num(r['Image-Overall'])!==undefined).map(r=>({model:text(r.Models),score:num(r['Image-Overall'])!,date:r.Date,metrics:Object.fromEntries(Object.entries(r).filter(([k])=>!['Rank','Date','Models','Image-Overall'].includes(k)).map(([k,v])=>[k,num(v)]).filter((p):p is [string,number]=>typeof p[1]==='number'))}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
