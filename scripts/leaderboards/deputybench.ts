// DeputyBench tests whether agents distinguish authorized requests from similar unsafe requests.
// Table 1 reports paired success with 95% intervals over task clusters. Table 12 reports resources per run.
import type { Leaderboard } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url='https://arxiv.org/html/2611.13355';
function interval(value:string) {
  const match=value.match(/^(\d+\.\d+) \[(\d+\.\d+), (\d+\.\d+)\]$/);
  if(!match) throw new Error('Invalid DeputyBench interval: '+value);
  return match.slice(1).map(v=>Number(v)*100);
}
const board: Leaderboard = {
  benchmark:'deputybench',static:'paper',url,feed:url,terms:PAPER_TERMS,
  aliases:{'Gemini 4':'gemini-4-argon','Seed 2.1 Pro':'doubao-seed-2-1-pro','Seed 2.1 Turbo':'doubao-seed-2-1-turbo'},
  parts:{safety:'Safety',completion:'Completion'},
  async fetch() {
    const tables=inlinePaperTables(await paperHtml(url));
    const result=tables.find(t=>t[0]?.join('|')==='Model|Safety|Completion|PSR');
    const usage=tables.find(t=>t[0]?.join('|')==='Model|input tokens / run|output tokens / run|tool calls / run|time / run (s)|round total (M tokens)');
    if(!result || !usage) throw new Error('Missing DeputyBench tables');
    const rows=result.slice(1).map(([model,s,c,p])=>{
      const [safety,safetyLow,safetyHigh]=interval(s);
      const [completion,completionLow,completionHigh]=interval(c);
      const [score,low,high]=interval(p);
      const counts=usage.find(row=>row[0]===model)?.slice(1);
      if(!counts || counts.length!==5 || counts.some(v=>!/^\d[\d,]*(?:\.\d+)?$/.test(v))) throw new Error('Missing resource counts for '+model);
      const [inputTokens,outputTokens,toolCalls,timeSeconds,roundMillions]=counts.map(v=>Number(v.replaceAll(',','')));
      return {model,setting:'Medium reasoning effort',score,low,high,trials:3,tokens:outputTokens,
        metrics:{safety,safetyLow,safetyHigh,completion,completionLow,completionHigh,inputTokens,outputTokens,
          totalTokens:inputTokens+outputTokens,toolCalls,timeSeconds,roundTokens:roundMillions*1e6}};
    });
    return checked(rows,12);
  },
};
export default board;
