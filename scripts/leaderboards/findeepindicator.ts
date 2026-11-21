// FinDeepIndicator tests financial indicator construction. OpenFinArena's leaderboard
// ranks overall accuracy and publishes separate U.S. and Chinese market scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://openfinarena.com/data/deepIndicatorLeaderboard.json';
type Result={method:string,type:string,overall:number,us:number,cn:number,team:string,submittedDate:string};
const board:Leaderboard={
  benchmark:'findeepindicator',url:'https://openfinarena.com/fin-deep-indicator',feed,
  terms:'The authors publish the leaderboard at https://openfinarena.com/fin-deep-indicator.',
  parts:{us:'U.S. market',cn:'Chinese market'},
  async fetch(){
    const data=await fetchJson<Result[]>(feed);
    const rows=data.map(r=>{
      if(!r.method || !r.type || ![r.overall,r.us,r.cn].every(v=>Number.isFinite(v) && v>=0 && v<=100)) throw new Error('Invalid FinDeepIndicator row');
      return {model:r.method,setting:r.type,score:r.overall,submitter:r.team,date:r.submittedDate,metrics:{us:r.us,cn:r.cn}};
    });
    return checked(rows,10);
  },
};
export default board;
