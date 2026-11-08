// AudioAgentBench's All view averages per-benchmark pass rates over its six scenarios.
// The official reader defines each mode's mean as "realRates.reduce((e,l)=>e+l,0)/t.realRates.length".
// It first averages the newest 20 runs per model, scenario and speech mode.
// Source: https://audioarena.ai/_next/static/chunks/842-82297dffd5e613d8.js
// Human and artificial speech are whole-benchmark configurations. Rehydrated runs are fallback data.
// GLM Realtime Air is excluded by the maker because its audio backend was unavailable.
// Only configurations with all six scenarios are returned. Model identifiers remain as published.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://audioarena.ai/api/leaderboard/runs?recent_per_group=20";
const board: Leaderboard = {
  benchmark: "audio-arena-arcada",
  url: "https://audioarena.ai/leaderboard",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson(FEED) as any;
    const runs=d.runs.filter((r:any)=>!/glm-realtime-air/i.test(r.model));
    const models=[...new Set(runs.map((r:any)=>r.model))] as string[];
    const scenarios=[...new Set(runs.map((r:any)=>r.benchmark))] as string[];
    if(scenarios.length!==6)throw new Error('Expected six scenarios');
    const out:LeaderboardRow[]=[];
    for(const model of models)for(const mode of ['Human speech','Artificial speech','Rehydrated']){
      const all=runs.filter((r:any)=>r.model===model && (mode==='Human speech'?r.isReal:mode==='Rehydrated'?!r.isReal&&r.rehydrated:!r.isReal&&!r.rehydrated));
      if(mode==='Rehydrated' && runs.some((r:any)=>r.model===model&&!r.rehydrated))continue;
      const rates=scenarios.map(task=>{const rs=all.filter((r:any)=>r.benchmark===task).slice(0,20);return rs.length?rs.reduce((s:number,r:any)=>s+(r.passRate??0),0)/rs.length:undefined;});
      if(rates.some(x=>x===undefined))continue;
      out.push({model,score:rates.reduce((s:number,x)=>s+x!,0)/6,setting:mode,
        metrics:Object.fromEntries(scenarios.map((k,i)=>[k,rates[i]!]))});
    }
    if(!out.length)throw new Error('No complete six-scenario configuration');return out;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  if (r.model === 'gpt-realtime') return {...r, model: 'GPT Realtime 1.5 (board label)'};
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
