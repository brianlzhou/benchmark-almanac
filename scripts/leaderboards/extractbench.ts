// ExtractBench published ranked systems and overall value F1 percentage. Cost_Per_Page is USD in the CSV (the README multiplies by 100 for cents); it remains a per-page metric, not per-document task cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/run-llama/ExtractBench/main/leaderboard.csv";
const board: Leaderboard = {
 benchmark: "extractbench",
 url: "https://github.com/run-llama/ExtractBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
return parseCsv(await fetchText(FEED)).filter(r=>r.Provider&&r.include_in_rankings==='true'&&num(r.Overall)!==undefined).map(r=>{const agent=r.Provider.match(/^(Claude Code|Codex) \(([^)]+)\)$/);let model=agent?agent[2]:r.Provider;if(agent?.[1]==='Claude Code')model='Claude '+model;return {model,score:num(r.Overall)!,harness:agent?.[1]??r.Pipeline,setting:r.Reasoning||undefined,metrics:Object.fromEntries(Object.entries(r).filter(([k])=>!['Provider','Category','Pipeline','Reasoning','include_in_rankings','Overall'].includes(k)).map(([k,v])=>[k,num(v)]).filter((p):p is [string,number]=>typeof p[1]==='number'))};});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
