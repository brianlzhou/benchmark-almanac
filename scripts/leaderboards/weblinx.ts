// WebLINX: use the published overall action-prediction score.
// Markup-ranker retrieval tests measure a different component and are excluded. Fine-tunes retain distinct identities.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://mcgill-nlp.github.io/weblinx/leaderboard/";
const board: Leaderboard = {
 benchmark: "weblinx",
 url: "https://mcgill-nlp.github.io/weblinx/leaderboard/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const ts=tables(await fetchText(FEED));const rows:LeaderboardRow[]=[];
for(const r of ts[0].slice(1))if(num(r[1].text)!==undefined)rows.push({model:r[0].text+(r[5].text.includes('✔')?' (WebLINX fine-tuned)':''),score:num(r[1].text)!,metrics:{intentMatch:num(r[2].text)!,elementIoU:num(r[3].text)!,textF1:num(r[4].text)!}});
return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
