import type { Leaderboard } from '../../leaderboards/types.ts';
import {fetchText} from '../util.ts';
import {jsLiteral} from '../html.ts';
export function carChallenge(track:number):Leaderboard {
 const base='https://car-bench.github.io/car-bench/',feed=base+'assets/data/competition-results.js?v=20260806-final';
 return {benchmark:'car-bench-challenge-2026-track-'+track,url:base+'leaderboard.html',feed,terms:'Official competition results. The Almanac credits and links the source.',async fetch(){
 const s=await fetchText(feed),d=jsLiteral<any>(s,s.indexOf('{'));
 await new Promise(r=>setTimeout(r,1050));const b=await fetchText(base+'assets/data/competition-baselines.js?v=20260806-results9'),baselines=jsLiteral<any[]>(b.replace(/'([^'\\]*)'/g, (_, value:string) => JSON.stringify(value)),b.indexOf('['));
 return [...d.teams,...baselines].filter(r=>r.track==='track_'+track).map(r=>({model:r.mainLlm.replace(/ via OpenRouter$/,'').replace(/^Cerebras /,''),score:r.metrics.pass3*100,harness:r.teamName,setting:'2026 hidden set; 30 tasks; 3 trials; '+r.key,cost:r.metrics.estimatedCostPerTrialUsd,metrics:{passAt3:r.metrics.passAt3*100,pass1:r.metrics.pass1*100,totalTokens:r.metrics.meanTokensPerTrial,latency:r.metrics.taskLatencyMeanMs/1000}}));
 }};
}
