// Mind2Web 2 private test set: success rate over 120 tasks, the default leaderboard ranking.
// The feed gives agent makers, architectures, pass@3 and mean duration in minutes. Agent product names remain intact when no exact base-model snapshot is supplied.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const URL='https://osu-nlp-group.github.io/Mind2Web-2/';
const board:Leaderboard={benchmark:'mind2web-2',url:URL,feed:URL+'leaderboard_data.json',
 terms:'Public maker-published Mind2Web 2 leaderboard. Benchmark Almanac credits the authors and links the source.',
 async fetch():Promise<LeaderboardRow[]>{const d=await fetchJson<any>(URL+'leaderboard_data.json');const rows:LeaderboardRow[]=[];
 for(const r of d.leaderboardData){if(r.info.type==='human'||!r.eval_set)continue;const e=r.eval_set,score=Number(e.success_rate);if(!Number.isFinite(score))continue;const metrics:Record<string,number>={};
 for(const key of ['partial_completion','pass3','answer_length']){const n=Number(e[key]);if(Number.isFinite(n))metrics[key==='pass3'?'passAt3':key]=n*(key==='answer_length'?1:100);}
 if(/^\d+(?:\.\d+)?$/.test(e.time)){metrics.minutes=Number(e.time);metrics.latency=metrics.minutes*60;}
 const base=r.info.details?.base_model;const exact=base==='o3';rows.push({model:exact?base:r.info.name,harness:exact?r.info.name:undefined,score:score*100,agentOrg:r.info.details?.organization || undefined,setting:r.info.details?.architecture || undefined,date:r.info.date,metrics});}
 if(!rows.length)throw new Error('Mind2Web 2 results missing');return rows;}};
export default board;
