// lmgame-Bench: the default all-six-games view ranks Avg Normalized Score (0–100).
// The official leaderboard_utils.py defines it as "df_results[normalized_columns].mean(axis=1).round(2)".
// data_visualization.py defines each part as "max(0, min(100, (z * 30) + 35))" using
// the sample standard deviation; absent game scores contribute zero. Reproduce that published
// definition, including baseline rows in normalization, while keeping raw game scores as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/lmgame/lmgame_bench/raw/main/rank_data_03_25_2025.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "lmgame-bench",
  url: "https://huggingface.co/spaces/lmgame/lmgame_bench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {"gemini-2.5-pro-preview-05-06": "gemini-2-5-pro-may-2025", "gemini-2.5-flash-preview-04-17": "gemini-2-5-flash-apr-2025", "deepseek-r1-0120": "deepseek-r1", "llama-4-maverick-17b-128e-instruct-fp8": "llama-4-maverick", "qwen3-235B-A22B-fp8": "qwen3-235b-a22b", "qwen3-235B-A22B-fp8-thinking": "qwen3-235b-a22b", "grok-4-0709": "grok-4", "kimi-k2-0711-preview": "kimi-k2-jul-2025", "gpt-5-thinking-high": "gpt-5"},
  
  async fetch() {
    const data = await fetchJson<Record<string, {runs?: number; results: any[]}>>(FEED);
    const games=['Super Mario Bros','Sokoban','2048','Candy Crush','Tetris','Ace Attorney'];
    const names=new Set(games.flatMap(g=>data[g]?.results.map(r=>r.model)??[]));
    const stats=Object.fromEntries(games.map(g=>{
      const scores=data[g].results.map(r=>r.score).filter(Number.isFinite);
      const mean=scores.reduce((a,b)=>a+b,0)/scores.length;
      const std=scores.length>1?Math.sqrt(scores.reduce((a,v)=>a+(v-mean)**2,0)/(scores.length-1)):0;
      return [g,{mean,std,positive:scores.reduce((a,b)=>a+b,0)>0}];
    }));
    const out:LeaderboardRow[]=[];
    for(const original of names){
      const name=original.replace(/^🎮\s*/u,'');if(/^random/i.test(name))continue;
      const metrics:Record<string,number>={};let total=0;
      for(const g of games){
        const score=data[g].results.find(r=>r.model===original)?.score;
        if(!Number.isFinite(score))continue;
        const key=g.toLowerCase().replace(/[^a-z0-9]+/g,'_');metrics[key]=score;
        const {mean,std,positive}=stats[g];
        const normalized=!positive?0:std===0?(score>0?50:0):Math.max(0,Math.min(100,(score-mean)/std*30+35));
        metrics['norm_'+key]=normalized;total+=normalized;
      }
      out.push({model:identity(name),score:Math.round(total/games.length*100)/100,
        setting:/thinking-high/.test(name)?'high':/thinking/.test(name)?'thinking':undefined,metrics});
    }
    if (!out.length) throw new Error('lmgame results missing');
    return out;
  },
};
export default board;
