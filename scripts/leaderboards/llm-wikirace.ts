// LLM-WikiRace defaults to Hard Success, as its page calls sortTable(3, "desc").
// Use that default view, with easy/medium success and tokens per step as metrics.
// The page defines no overall difficulty aggregate, so none is computed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://llmwikirace.github.io/";
const board: Leaderboard = {
 benchmark: "llm-wikirace",
 url: "https://llmwikirace.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const t=tables(await fetchText(FEED))[0];
return t.slice(1).filter(r => num(r[3]?.text) !== undefined).map(r => ({
  model:r[0].text.replace(/ NEW$/,''),score:num(r[3].text)!,
  metrics:{easy:num(r[1].text)!,medium:num(r[2].text)!,tokensPerStep:num(r[4].text)!}
}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
