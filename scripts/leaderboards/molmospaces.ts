// MolmoSpaces Manipulation uses its Combined view for pick, place, open and close.
// This is the benchmark in the catalog, excluding the later MolmoBot and Commonsense tracks.
// The official reader defines its mean with "rn.oracleRates.reduce((Ne,Ye)=>Ne+Ye,0)/xe".
// Here xe is the number of selected task types. Missing task results contribute zero, as on the board.
// Source: https://molmospaces.allen.ai/assets/index-Cbh0yr1e.js
// Oracle Rate is the board's default headline. Task rates remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://molmospaces.allen.ai/benchmark/data/index.json";
const board: Leaderboard = {
  benchmark: "molmospaces",
  url: "https://molmospaces.allen.ai/leaderboard/ms",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const index=await fetchJson(FEED) as any;
    const tasks=index.tasks.filter((t:any)=>['ms_pick','ms_pick_place','ms_open','ms_close'].includes(t.id));
    if(tasks.length!==4) throw new Error('MolmoSpaces task set changed');
    const out=new Map<string,Record<string,number>>();
    const read=async(url:string)=>{await new Promise(r=>setTimeout(r,1100));return parseCsv((await fetchText(url)).split(/\r?\n/).filter(l=>!l.trimStart().startsWith('#')).join('\n'));};
    for(const task of tasks){
      const base='https://molmospaces.allen.ai/benchmark/data/'+task.id+'/';
      const metadata=await read(base+'metadata.csv');
      for(const policy of task.policies){
        const rows=await read(base+policy+'.csv');
        const overall=rows.find(r=>r.category==='OVERALL');
        if(!overall)throw new Error('Missing overall: '+task.id+'/'+policy);
        const score=num(overall.oracle_rate_pct || overall.success_rate_pct);
        if(score===undefined)throw new Error('Invalid overall: '+task.id+'/'+policy);
        const name=metadata.find(r=>r.file===policy)?.Policy || policy;
        const metrics=out.get(name)||{};
        if(metrics[task.id]!==undefined)throw new Error('Duplicate policy name');
        metrics[task.id]=score;out.set(name,metrics);
      }
    }
    return [...out].map(([model,metrics])=>({model,score:Object.values(metrics).reduce((s,x)=>s+x,0)/4,metrics:{...metrics,taskTypesReported:Object.keys(metrics).length}}));
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
