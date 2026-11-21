// OpenCompass ranks spatial models by the mean Overall score across five benchmarks. The circular evaluation uses the four multiple-choice benchmarks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { openvlmInfo, type OpenVlmEntry } from '../lib/boards/openvlm.ts';
import { OPENVLM_ALIASES } from './openvlm-leaderboard.ts';

const feed = "http://opencompass.openxlab.space/assets/SpatialLB.json";
const tasks=["BLINK", "LEGO", "3DSRBench", "Spatial457", "MMSIBench"];

const board: Leaderboard = {
  benchmark: "openlmm-spatial-leaderboard",
  url: "https://huggingface.co/spaces/opencompass/openlmm_spatial_leaderboard",
  feed,
  terms: "The Space publishes its loader at https://huggingface.co/spaces/opencompass/openlmm_spatial_leaderboard/tree/main. Results licensing requires separate verification. Hugging Face allows crawling. The results host denies access to robots.txt.",
  aliases:OPENVLM_ALIASES,verified:'marked verified by OpenCompass',
  async fetch(){
    const {results}=await fetchJson<{results:Record<string,OpenVlmEntry>}>(feed);
    const rows:LeaderboardRow[]=[];board.parts={};
    for(const r of Object.values(results)){
      const model=r.META?.Method?.[0];
      if(!model) throw new Error('Missing model');
      for(const circular of [false,true]){
        const tasksUsed=tasks.filter(k=>!(circular && k==='Spatial457'));
        const metrics:Record<string,number>={};
        for(const task of tasksUsed){
          const item=r[task+(circular?'_circular':'')];
          if(!item) continue;
          for(const [label,v] of Object.entries(item)){
            const key=label==='Overall'?task:task+'_'+label;
            if(!Number.isFinite(v)) throw new Error('Invalid '+key);
            metrics[key]=v;board.parts[key]=label==='Overall'?task:{name:label,group:task};
          }
        }
        if(!tasksUsed.every(k=>Number.isFinite(metrics[k]))) continue;
        const mean=tasksUsed.reduce((s,k)=>s+metrics[k],0)/tasksUsed.length;
        rows.push({model,score:Number(mean.toFixed(1)),setting:circular?'Circular':'Standard',...openvlmInfo(r.META),
          date:r.META?.Time?.replaceAll('/','-'),link:r.META?.Method?.[1],metrics});
      }
    }
    if(rows.length<117) throw new Error('Incomplete spatial ranking');
    return rows;
  },
};
export default board;
