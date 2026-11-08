// InterCode CTF: the Inspect report publishes accuracy fractions, converted to percentages.
// This implementation applies the report’s GDM/Inspect task exclusions, named in the setting.
// DNF is not a score and is omitted; the reported standard error is retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://ukgovernmentbeis.github.io/inspect_evals/evals/gdm_intercode_ctf/index.html";
const board: Leaderboard = {
 benchmark: "intercode-ctf",
 url: "https://ukgovernmentbeis.github.io/inspect_evals/evals/gdm_intercode_ctf/index.html",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Accuracy') && t[0]?.some(c=>c.text==='Stderr'));
  if(!t)throw new Error('Inspect CTF results missing');
  return t.slice(1).filter(r=>num(r[2]?.text)!==undefined).map(r=>({model:r[0].text,score:num(r[2].text)!*100,harness:'Inspect gdm_intercode_ctf',setting:'Inspect/GDM task exclusions',metrics:{stderr:num(r[3].text)!*100}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
