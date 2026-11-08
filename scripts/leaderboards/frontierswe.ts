// FrontierSWE: the server-rendered root includes every model's mean@5 score, in percent, plus best/worst
// trials and per-trial cost and duration. Read public hydration data without using the restricted API.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';
const FEED = 'https://www.frontierswe.com/';
interface Entry {model:string; harness:string; overall:number; avgCostUsd:number|null; avgTokensOut:number|null; avgTokensTotal:number|null; avgDurationSeconds:number|null; implementation:number; performance:number; research:number; costCaveat?:string|null}
const board: Leaderboard = {
  benchmark:'frontierswe',url:FEED,feed:FEED,
  terms:'Public FrontierSWE root page allowed by robots.txt; results remain credited to FrontierSWE under the site terms.',
  chart:{title:'Score vs. cost',x:{key:'cost',label:'Mean cost per trial',unit:'$',better:'lower',log:true},y:{key:'score',label:'Mean@5 score',unit:'%',better:'higher'},note:'Mean score across tasks against mean cost per trial, using the leaderboard aggregation.'},
  async fetch(){
    const entries=jsonAfter<{abs:{mean:Entry[];best:Entry[];worst:Entry[]}}>(nextFlight(await fetchText(FEED)),'"entries":').abs;
    if(!entries.mean?.length)throw new Error('Missing FrontierSWE mean results');
    return entries.mean.map(r=>({model:r.model,score:r.overall,harness:r.harness,setting:'mean@5'+(r.costCaveat?`; ${r.costCaveat}`:''),cost:r.avgCostUsd??undefined,tokens:r.avgTokensOut??undefined,metrics:Object.fromEntries(Object.entries({cost:r.avgCostUsd,latency:r.avgDurationSeconds,tokensTotal:r.avgTokensTotal,implementation:r.implementation,performance:r.performance,research:r.research,best5:entries.best.find(b=>b.model===r.model&&b.harness===r.harness)?.overall,worst5:entries.worst.find(b=>b.model===r.model&&b.harness===r.harness)?.overall}).filter(([,v])=>typeof v==='number')) as Record<string,number>}));
  },
};
export default board;
