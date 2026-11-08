// GameCraft-Bench overall rubric percentage, preserving harness and effort. The separate usage table supplies output tokens per task for uniquely identified runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/tongxuluo/gamecraft-bench/main/README.md";
const board: Leaderboard = {
 benchmark: "gamecraft-bench",
 url: "https://github.com/tongxuluo/gamecraft-bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const ts=markdownTables(await fetchText(FEED));const t=ts.find(t=>t[0].includes('Harness'))!;const usage=ts.find(t=>t[0].includes('Avg output / task'))!;const norm=(s:string)=>s.replace(/claude|[()]/gi,'').replace(/codex/gi,'').replace(/[^a-z0-9]/gi,'').toLowerCase();const amount=(s:string)=>num(s)!*(/B$/i.test(s)?1e9:/M$/i.test(s)?1e6:/K$/i.test(s)?1e3:1);
return t.slice(1).map(r=>{let model=r[1];const effort=model.match(/\s+(xhigh|high|medium|low)$/)?.[1];if(effort)model=model.slice(0,-effort.length).trim();if(/^(Opus|Fable|Sonnet|Haiku)/.test(model))model='Claude '+model;const u=usage.slice(1).find(u=>norm(u[0])===norm(model));return {model,score:num(r[4])!,harness:r[0],setting:effort,date:r[3],...(u?{tokens:amount(u[6])}:{}),metrics:{mechanics:num(r[5])!,depth:num(r[6])!,visuals:num(r[7])!,art:num(r[8])!,...(u?{inputTokensPerTask:amount(u[5]),cacheTokensTotal:amount(u[3])}:{})}};});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
