// Bevaya ranks configurations by macro field accuracy on loss runs. Its chart module contains document cost, latency and separate claims and policy results.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { jsLiteral } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "loss-run-extraction-bevaya",
  url: "https://www.bevaya.ai/benchmarks",
  feed: "https://www.bevaya.ai/benchmarks",
  terms: "Bevaya grants internal business use. Other uses require written authorization. https://www.bevaya.ai/legal/terms-and-conditions robots.txt allows the benchmark.",
  stats: { latency:{name:'Latency',unit:'seconds',better:'lower'}, pct_perfect:{name:'Perfect extraction rate',unit:'%',better:'higher'}, micro_acc:{name:'Micro accuracy',unit:'%',better:'higher'}, pct_perfect_claims:{name:'Perfect claims rate',unit:'%',better:'higher'}, micro_acc_claims:{name:'Claims micro accuracy',unit:'%',better:'higher'}, pct_perfect_policy:{name:'Perfect policy rate',unit:'%',better:'higher'}, micro_acc_policy:{name:'Policy micro accuracy',unit:'%',better:'higher'}, cost_mean:{name:'Mean cost',unit:'usd',better:'lower'}, cost_mean_claims:{name:'Mean claims cost',unit:'usd',better:'lower'}, cost_mean_policy:{name:'Mean policy cost',unit:'usd',better:'lower'}, cost_p25:{name:'Cost p25',unit:'usd',better:'lower'}, cost_p75:{name:'Cost p75',unit:'usd',better:'lower'}, cost_p25_claims:{name:'Claims cost p25',unit:'usd',better:'lower'}, cost_p75_claims:{name:'Claims cost p75',unit:'usd',better:'lower'}, cost_p25_policy:{name:'Policy cost p25',unit:'usd',better:'lower'}, cost_p75_policy:{name:'Policy cost p75',unit:'usd',better:'lower'}, lat_mean:{name:'Mean latency',unit:'seconds',better:'lower'}, lat_mean_claims:{name:'Mean claims latency',unit:'seconds',better:'lower'}, lat_mean_policy:{name:'Mean policy latency',unit:'seconds',better:'lower'}, lat_p25:{name:'Latency p25',unit:'seconds',better:'lower'}, lat_p75:{name:'Latency p75',unit:'seconds',better:'lower'}, lat_p25_claims:{name:'Claims latency p25',unit:'seconds',better:'lower'}, lat_p75_claims:{name:'Claims latency p75',unit:'seconds',better:'lower'}, lat_p25_policy:{name:'Policy latency p25',unit:'seconds',better:'lower'}, lat_p75_policy:{name:'Policy latency p75',unit:'seconds',better:'lower'}, n_samples:{name:'Sample count',unit:'count'} },
  parts: { macro_acc_claims:"Claims",macro_acc_policy:"Policy" },
  async fetch() {
    const html = await fetchText(this.url);
    const asset = html.match(/src="([^"]+module_Benchmark_8-2026\.min\.js)"/)?.[1];
    if (!asset) throw new Error('Missing Bevaya chart');
    await new Promise(resolve => setTimeout(resolve,1050));
    const js = await fetchText(new URL(asset,this.url).href);
    const match = /const DATA=(\[\{folder:)/.exec(js);
    if (!match) throw new Error('Missing Bevaya chart data');
    const source = js.slice(match.index+'const DATA='.length).replace(/:!(0|1)(?=,|})/g,(_,b) => b==='0' ? ':true' : ':false').replace(/:([+-]?)\.(\d+)/g, ':$10.$2');
    const runs = jsLiteral<(Record<string,unknown> & { label:string,folder:string,variant:string,thinking:boolean,macro_acc:number,cost_mean:number,lat_mean:number })[]>(source,0);
    if (runs.length < 20) throw new Error('Missing Bevaya configurations');
    return runs.map(r => {
      if (!r.label || ![r.macro_acc,r.cost_mean,r.lat_mean].every(Number.isFinite)) throw new Error('Missing Bevaya measurements');
      const metrics: Record<string,number> = {latency:r.lat_mean};
      for (const [key,v] of Object.entries(r)) if (typeof v==='number' && key!=='macro_acc') metrics[key]=v;
      return {model:r.label, score:r.macro_acc, setting:r.variant==='standard' ? (r.thinking ? (r.folder.includes('_medium_') ? 'medium thinking' : 'thinking') : 'non-thinking') : r.variant, cost:r.cost_mean, metrics};
    });
  },
};
export default board;
