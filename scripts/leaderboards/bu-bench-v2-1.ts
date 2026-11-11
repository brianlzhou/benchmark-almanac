// The full server-rendered table includes all reasoning settings, not just the best setting per model.
// Score is the published weighted rubric score. Costs use dollars per task, including cent-valued cells.
// Median minutes stay separate from flagged runs made on non-comparable CI runners.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,num,text} from '../lib/html.ts';
const URL='https://browser-use.com/benchmarks/agents';
export default {benchmark:'bu-bench-v2-1',url:URL,feed:URL,
 terms:'Browser Use terms prohibit automated scraping and data mining; the almanac credits Browser Use and links the source.',
 chart:{title:'Score vs. cost per task',x:{key:'cost',label:'Cost per task',unit:'$',log:true,better:'lower'},y:{key:'score',label:'Score',unit:'score',better:'higher'}},
 async fetch():Promise<LeaderboardRow[]> {
  const html=await fetchText(URL);
  if(!/v2\.1/i.test(html))throw new Error('BU Bench version changed');
  const ts=tables(html).filter(t=>t[0]?.some(c=>c.text==='Cost / task'));
  const t=ts.sort((a,b)=>b.length-a.length)[0];if(!t)throw new Error('BU Bench full table missing');
  const rows:LeaderboardRow[]=[];
  for(const r of t.slice(1)){
   const model=text(r[1]?.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1]??'');
   const setting=text(r[1]?.html.match(/<small\b[^>]*>([\s\S]*?)<\/small>/)?.[1]??'');
   const score=num(r[2]?.text),amount=num(r[3]?.text);if(!model||score===undefined)continue;
   const cost=amount===undefined?undefined:amount*(r[3].text.includes('¢')?0.01:1);
   const minutes=num(r[4]?.text);const metrics:Record<string,number>={};
   if(minutes!==undefined)metrics[r[4].text.includes('†')?'medianMinutesDifferentRunners':'medianMinutes']=minutes;
   rows.push({model,score,cost,setting:setting||undefined,harness:model==='Browser Use'?'Browser Use':'BrowserCode',metrics});
  }
  if(!rows.length)throw new Error('BU Bench rows missing');return rows;
 }
} satisfies Leaderboard;
