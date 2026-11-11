// Chartography (Surge AI): all-pass accuracy in percent on professional chart questions.
// The primary table and Pareto charts have different snapshots. Retain chart configurations
// separately and attach cost/generated tokens only to the exact plotted run, never today's table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
import { SURGE_TERMS, SURGE_ALIASES, surgeRows, surgeName } from '../lib/boards/surgehq-cov2.ts';
const PAGE='https://surgehq.ai/benchmarks/chartography';
interface Point {label:string;x:number;y:number}
export default {
 benchmark:'chartography',url:PAGE,feed:`${PAGE} (primary table and linked chartography-charts.js)`,terms:SURGE_TERMS,aliases:SURGE_ALIASES,
 chart:{title:'Score vs. generated tokens',x:{key:'generatedTokens',label:'Generated tokens per trial',better:'lower',log:true},y:{key:'score',label:'Score (pass@1)',unit:'%',better:'higher'},note:'The published Pareto chart snapshot is separate from the current leaderboard.'},
 async fetch(){
  const page=await fetchText(PAGE); const rows=surgeRows(page);
  const src=page.match(/<script[^>]+src="([^"]*chartography-charts\.js)"/)?.[1];
  if(!src)throw new Error('Chartography Pareto script missing');
  const data=jsonAfter<{cost:{all:Point[]};tok:{all:Point[]}}>(await fetchText(src),'var DATA = ');
  if(!data?.cost?.all?.length || !data?.tok?.all?.length)throw new Error('Chartography Pareto data missing');
  const plot=new Map<string,LeaderboardRow>();
  for(const p of data.cost.all){
   const n=surgeName(p.label.replace(/^(Opus|Sonnet|Fable) /,'Claude $1 '));
   plot.set(`${p.label}|${p.y}`,{...n,score:p.y*100,setting:`Pareto chart; ${n.setting ?? 'effort unspecified'}`,cost:p.x});
  }
  for(const p of data.tok.all){
   const key=`${p.label}|${p.y}`;
   const n=surgeName(p.label.replace(/^(Opus|Sonnet|Fable) /,'Claude $1 '));
   const r=plot.get(key)??{...n,score:p.y*100,setting:`Pareto chart; ${n.setting ?? 'effort unspecified'}`};
   r.tokens=p.x;r.metrics={generatedTokens:p.x};plot.set(key,r);
  }
  return rows.concat([...plot.values()]);
 }
} satisfies Leaderboard;
