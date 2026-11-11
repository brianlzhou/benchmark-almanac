// PaperBench Code-Dev: score the coding-only variant separately from full replication.
// Agent names become harnesses; reasoning effort and explicit time limits become settings. The reported
// plus/minus value is preserved without assuming it is a confidence interval. Undated API names stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/openai/frontier-evals/main/project/paperbench/README.md";
const board: Leaderboard = {
 benchmark: "paperbench-code-dev", url: "https://raw.githubusercontent.com/openai/frontier-evals/main/project/paperbench/README.md", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const md=await fetchText(FEED);const rows: LeaderboardRow[]=[];
for(const b of md.split(/^### /m).slice(1)) {
 const title=b.split('\n')[0].trim();if(title!=='PaperBench Code-Dev Results')continue;
 for(const l of b.split('\n')) {
  const c=l.split('|').slice(1,-1).map(s=>s.trim());if(c.length!==4)continue;
  const score=num(c[1]);const m=c[0].match(/^(\S+)\s+(\S+)(?:\s+\(([^)]+)\))?$/);if(!m||score===undefined)continue;
  let model=m[2];const effort=model.match(/-(high|medium|low)$/)?.[1];if(effort)model=model.replace(/-(high|medium|low)$/,'');
  if(/^(gpt-4o|claude-3\.5-sonnet|gemini-2\.0-flash)$/i.test(model))model+=' [snapshot unspecified]';
  const uncertainty=num(c[1].split('±')[1]);
  rows.push({model,score,harness:m[1],setting:[title.replace(' Results',''),effort,m[3]].filter(Boolean).join('; '),date:c[3],metrics:{runs:Number(c[2]),...(uncertainty===undefined?{}:{reportedUncertainty:uncertainty})}});
 }
}
if(!rows.length)throw new Error('No PaperBench results');return rows;
 },
};
export default board;
