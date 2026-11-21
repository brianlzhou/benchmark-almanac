// Round 4 ranks models by Youden’s J for respecting hard limits and engaging with allowed requests. PlotPoints publishes the index and its component rates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://plotlightstudios.com/api/plotpoints/leaderboard?round=4";
interface Run {name:string;ranked:boolean;J:number|null;[key:string]:unknown}

const board: Leaderboard = {
  benchmark: "plotpoints-round-4",
  url: "https://plotlightstudios.com/plotpoints/leaderboard",
  feed,
  terms: "PlotPoints labels its public results CC BY 4.0. The repository and Hugging Face dataset list CC BY-NC 4.0. https://plotlightstudios.com/plotpoints https://huggingface.co/datasets/lazyweasel/roleplay-bench The site disallows /api/ in robots.txt.",
  stats: { held_first_rate: { name: 'Held first rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' }, held_first_k: { name: 'Held first count', unit: 'count' }, held_first_n: { name: 'Held first sessions', unit: 'count' }, held_under_pressure_rate: { name: 'Held under pressure rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' }, held_under_pressure_kept: { name: 'Held under pressure count', unit: 'count' }, held_under_pressure_n: { name: 'Held under pressure sessions', unit: 'count' }, over_refusal_hard_rungs: { name: 'Over-refusal hard rungs', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, over_refusal_intimacy: { name: 'Over-refusal intimacy', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, over_refusal_gore: { name: 'Over-refusal gore', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, over_refusal_rate: { name: 'Over-refusal rate', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, policy_compliance_rate: { name: 'Policy compliance rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' }, overshoot_rate: { name: 'Overshoot rate', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, empty_rate: { name: 'Empty response rate', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, empty_by_subtrack_gore: { name: 'Empty gore response rate', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, empty_by_subtrack_intimacy: { name: 'Empty intimacy response rate', unit: 'score', better: 'lower', note: 'Rate stored from 0 to 1.' }, empty_rung_slope: { name: 'Empty response rung slope', unit: 'score' }, n_sessions_a: { name: 'Sessions A', unit: 'count' }, n_sessions_b: { name: 'Sessions B', unit: 'count' }, usable_exchanges_a: { name: 'Usable exchanges A', unit: 'count' }, hard_refusals_a: { name: 'Hard refusals A', unit: 'count' }, old_judge_band_mean: { name: 'Old judge band mean', unit: 'score', better: 'higher' }, old_judge_band_n_sessions: { name: 'Old judge band sessions', unit: 'count' }, r3_nsfw_rank_of: { name: 'Round 3 NSFW rank', unit: 'count', better: 'lower' } },
  async fetch(){
    const d=await fetchJson<{round:number;board:{rows:Run[]}}>(feed);
    const ranked=d.board.rows.filter(r=>r.ranked);
    if(d.round!==4 || ranked.length<55) throw new Error('Incomplete Round 4 ranking');
    return ranked.map(r=>{
      if(!r.name || !Number.isFinite(r.J)) throw new Error('Missing ranked J');
      const metrics:Record<string,number>={};
      function collect(values:Record<string,unknown>,prefix=''){
        for(const [k,v] of Object.entries(values)){
          if(k==='J' || k==='rank') continue;
          if(typeof v==='number') metrics[prefix+k]=v;
          else if(v && typeof v==='object' && !Array.isArray(v)) collect(v as Record<string,unknown>,prefix+k+'_');
        }
      }
      collect(r);return {model:r.name,score:r.J!,metrics};
    });
  },
};
export default board;
