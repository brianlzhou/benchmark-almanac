// KORGym evaluates reasoning in games. The makers' leaderboard ranks models by the normalized average across five capabilities.
// The main table uses a 0 to 1 scale. Per-game panels use the individual games' raw scores.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://razor233.github.io/KORGYM_HomePage/static/data/leaderboard_data.json';
const dimensions=['Control and Interaction','Puzzle','Mathematical and Logical','Spatial and Geometric','Strategic'];
interface Entry {model:string;type:string;thinking:boolean;[key:string]:string|boolean}
const board:Leaderboard={
  benchmark:'korgym',feed,url:'https://razor233.github.io/KORGYM_HomePage/#leaderboard',
  terms:'Public leaderboard published by the KORGym authors: https://razor233.github.io/KORGYM_HomePage/',
  aliases:{'Claude-3.7-thinking':'claude-3-7-sonnet','Claude-3.7':'claude-3-7-sonnet','Qwen3-32B-thinking':'qwen3-32b',
    'Gemini-2.5-pro-03-25':'gemini-2-5-pro-mar-2025','DeepSeek-v3-0324':'deepseek-v3-mar-2025','O1-2024-12-17':'o1'},
  async fetch(){
    const entries=await fetchJson<Entry[]>(feed);
    const parts:Record<string,string|BoardPart>=Object.fromEntries(dimensions.map(k=>[k,k]));
    const rows=entries.filter(r=>r.type==='overall').map(r=>{
      const metrics:Record<string,number>={};
      for(const k of dimensions){
        if(typeof r[k]!=='string' || !String(r[k]).trim() || !Number.isFinite(Number(r[k]))) throw Error('Missing '+k+' for '+r.model);
        metrics[k]=Number(r[k]);
      }
      for(const sub of entries.filter(s=>s.model.trim()===r.model.trim() && s.type!=='overall' && s.type!=='multimodal')){
        for(const [k,v] of Object.entries(sub)){
          if(['model','type','thinking'].includes(k) || typeof v!=='string' || !v.trim() || !Number.isFinite(Number(v))) continue;
          const key=sub.type+' '+k;
          metrics[key]=Number(v);
          parts[key]={name:k,group:sub.type,unit:'score',note:'Raw game score.'};
        }
      }
      if(typeof r.Avg!=='string' || !r.Avg.trim()) throw Error('Missing published average');
      return {model:r.model.trim(),setting:r.thinking?'Thinking':'Non-thinking',score:Number(r.Avg),metrics};
    });
    board.parts=parts;
    return checked(rows,19);
  },
};
export default board;
