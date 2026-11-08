// BrowseComp-ZH: the official README’s Accuracy percentage is the score.
// Reasoning and browsing configurations and calibration error stay attached to each published entry.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/PALIN2018/BrowseComp-ZH/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "browsecomp-zh",
 url: "https://github.com/PALIN2018/BrowseComp-ZH",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Accuracy'));
  if (!t) throw new Error('BrowseComp-ZH table missing');
  return t.slice(1).filter(r=>num(r[4])!==undefined).map(r=>({model:r[0],score:num(r[4])!,
    setting:`reasoning: ${r[2]}; browsing: ${r[3]}`,metrics:{calibrationError:num(r[5])!}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
