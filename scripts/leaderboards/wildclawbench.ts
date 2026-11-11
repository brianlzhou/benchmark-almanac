// WildClawBench: Overall Score is the percentage on the full task suite. Total cost and time
// are divided by the live task-count table; the comparison table already gives per-task cost and minutes.
// Additional harness results remain separate from the OpenClaw leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/InternLM/WildClawBench/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "wildclawbench",
 url: "https://github.com/InternLM/WildClawBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 aliases: {'Muse Glimmer 30B':'muse-glimmer'},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const ts=markdownTables(await fetchText(FEED));
  const t=ts.find(t=>t[0].includes('Overall Score'));
  const tasks=ts.find(t=>t[0].includes('Category') && t[0].includes('#'));
  if(!t||!tasks) throw new Error('WildClawBench leaderboard or task counts missing');
  const count=tasks.slice(1).reduce((sum,r)=>sum+(num(r[1])??0),0);
  if(count<=0) throw new Error('WildClawBench task count missing');
  const rows:LeaderboardRow[]=t.slice(1).filter(r=>num(r[3])!==undefined).map(r=>({model:r[1],score:num(r[3])!,harness:'OpenClaw',
    cost:r[5]==='Free'?0:num(r[5])!==undefined?num(r[5])!/count:undefined,
    metrics:{minutesPerTask:num(r[4])!/count}}));
  const comparison=ts.find(t=>t[0].includes('Hermes Agent'));
  for(const r of comparison?.slice(2)??[]) for(const [index,harness] of [[4,'Claude Code'],[7,'Codex'],[10,'Hermes Agent']] as const){
    const score=num(r[index+2]);if(score===undefined)continue;
    rows.push({model:r[0],harness,score,cost:num(r[index+1]),metrics:{minutesPerTask:num(r[index])!}});
  }
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
