// ToolBench: use the published Average pass rate for each model and method.
// Average win rate and task-group pass rates are secondary metrics. Methods remain harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/OpenBMB/ToolBench/master/README.md";
const board: Leaderboard = {
 benchmark: "toolbench", url: "https://github.com/OpenBMB/ToolBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const ts=mdTables(await fetchText(FEED)).filter(t=>t.head[0]==='Method'&&t.head.at(-1)==='Average');if(ts.length!==2)throw new Error('Expected pass/win tables');const rows:LeaderboardRow[]=[];
 for(const [i,t] of ts.entries()){let harness='';for(const r of t.rows){harness=r[0]||harness;const score=num(r.at(-1));if(score===undefined)continue;let model=r[1];if(['ChatGPT','GPT4','Claude-2'].includes(model))model+=' [snapshot unspecified]';rows.push({model,harness,score,setting:i===0?'Pass rate':'Win rate versus ChatGPT ReACT',metrics:Object.fromEntries(t.head.slice(2,-1).map((h,j)=>[h,num(r[j+2])!]))});}}
 return rows.filter(r => r.setting === 'Pass rate').map(r => {
  const win=rows.find(x => x.model===r.model && x.harness===r.harness && x.setting==='Win rate versus ChatGPT ReACT');
  return {...r,setting:undefined,metrics:{...r.metrics,...(win ? {winRate:win.score} : {})}};
 });
 },
};
export default board;
