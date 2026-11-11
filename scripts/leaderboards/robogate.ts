// RoboGate reports real-inference success on its 68-scenario industrial Pick&Place protocol.
// Rates are fractions converted to percentages; scripted reference policies are excluded.
// These qualified zero-success runs do not imply general policy inability.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/liveplex-cpu/robogate-leaderboard/main/leaderboard.json";
const board: Leaderboard = {
 benchmark: "robogate", url: "https://github.com/liveplex-cpu/robogate-leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const d=await fetchJson<any>(FEED);return d.policies.filter((r:any)=>typeof r.success_rate==='number').map((r:any)=>({model:r.model.startsWith('octo-')?r.model+' [policy variant]':r.model,score:r.success_rate*100,setting:d.suite+'; real-inference protocol',date:r.run_date??undefined,metrics:{scenariosPassed:r.scenarios_pass,scenariosTotal:r.scenarios_total,graspMissRate:r.grasp_miss_rate*100,...(typeof r.inference_avg_ms==='number'?{latency:r.inference_avg_ms/1000}:{})}}));
 },
};
export default board;
