// The OpenVLM Video Leaderboard sorts by Avg Rank across five video benchmarks. The public results file also supplies the normalized Avg Score and underlying measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { openvlmInfo, type OpenVlmEntry } from '../lib/boards/openvlm.ts';
import { OPENVLM_ALIASES } from './openvlm-leaderboard.ts';

const feed = "http://opencompass.openxlab.space/utils/video_leaderboard.json";
const tasks=['Video-MME (w/o subs)','MVBench','MMBench-Video','TempCompass','MLVU'];
function value(r:OpenVlmEntry,k:string){
 const m=r[k];
 if(!m) return undefined;
 return k==='MLVU'?m['M-Avg']*0.84+m['G-Avg']*10*0.16:k==='TempCompass'?m.overall:m.Overall;
}

const board: Leaderboard = {
  benchmark: "openvlm-video-leaderboard",
  url: "https://huggingface.co/spaces/opencompass/openvlm_video_leaderboard",
  feed,
  terms: "The Space publishes its loader at https://huggingface.co/spaces/opencompass/openvlm_video_leaderboard/tree/main. Results licensing requires separate verification. Hugging Face allows crawling. The results host denies access to robots.txt.",
  aliases:OPENVLM_ALIASES,verified:'marked verified by OpenCompass',
  stats: { avgScore: { name: 'Average score', unit: 'score', better: 'higher' } },
  async fetch(){
    const all=Object.values((await fetchJson<{results:Record<string,OpenVlmEntry>}>(feed)).results);
    const rows:LeaderboardRow[]=[];board.parts={};
    for(const r of all){
      const model=r.META?.Method?.[0];
      if(!model) throw new Error('Missing method');
      if(!tasks.every(k=>Number.isFinite(value(r,k)))) continue;
      let rank=0,avg=0;const metrics:Record<string,number>={};
      for(const k of tasks){
        const v=value(r,k)!;
        rank+=1+all.filter(other=>value(other,k)!>v).length;
        avg+=k==='MMBench-Video'?v/3*100:v;
        metrics[k]=v;board.parts[k]=k;
        for(const [label,number] of Object.entries(r[k]!)){
          if(!Number.isFinite(number)) continue;
          const key=k+'_'+label;metrics[key]=number;board.parts[key]={name:label,group:k};
        }
      }
      metrics.avgScore=Number((avg/tasks.length).toFixed(1));
      const meta=r.META as NonNullable<OpenVlmEntry['META']> & { Frames:string };
      rows.push({model,score:Number((rank/tasks.length).toFixed(2)),...openvlmInfo(meta),setting:meta.Frames+' frames',
        date:meta.Time?.replaceAll('/','-'),link:meta.Method?.[1],metrics});
    }
    if(rows.length<37) throw new Error('Incomplete video rankings');
    return rows;
  },
};
export default board;
