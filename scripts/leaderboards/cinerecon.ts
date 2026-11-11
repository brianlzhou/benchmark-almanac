// CineRecon uses the official page default "All settings · mean" and "Overall".
// The page defines "Overall benchmark scores across all cases, averaged across the three
// representation settings"; app.js defines r.overall=(r.camera+r.static+r.dynamic)/3.
// Preserve this published formula, effort and per-video generation cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://cinerecon.github.io/assets/results.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "cinerecon",
  url: "https://cinerecon.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at cinerecon.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  chart:{title:'Performance and generation cost',x:{key:'cost',label:'Generation API cost per video',unit:'$',better:'lower'},y:{key:'score',label:'Mean checklist score',unit:'%',better:'higher'},note:'Costs and chart scores average across representation settings.'},
  async fetch() {
    const d=await fetchJson<any>(FEED);const costs=await fetchJson<any[]>('https://cinerecon.github.io/assets/costs.json');
    const out:LeaderboardRow[]=[];
    for(const id of d.models)for(const level of ['mean']){
      const levels=level==='mean'?['L1','L2','L3']:[level];const metrics:Record<string,number>={};
      for(const key of new Set<string>(levels.flatMap(l=>Object.keys(d.scores[id][l])))){const values=levels.map(l=>d.scores[id][l][key]).filter(Number.isFinite);if(values.length)metrics[key]=values.reduce((a,b)=>a+b,0)/values.length;}
      const score=(metrics.camera+metrics.static+metrics.dynamic)/3;
      const cost=level==='mean'?costs.find(r=>r.model===id)?.cost:undefined;if(cost!==undefined)metrics.cost=cost;
      const low=/\(Low\)/i.test(d.names[id]);out.push({model:identity(d.names[id].replace(/\s*\(Low\)/i,'')),score,setting:({mean:'All settings mean',L1:'Proxy',L2:'Simplified',L3:'Detailed'} as any)[level]+(low?'; low effort':id==='opus55'?'; high effort':''),cost,metrics});
    }if(!out.length)throw new Error('CineRecon scores missing');return out;
  },
};
export default board;
