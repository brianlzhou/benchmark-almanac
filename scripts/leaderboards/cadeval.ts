// CadEval uses overall pass rate from the dated public evaluation run.
// Cost and completion-token means retain the source averaging scope and checks-run counts.
// All numeric geometry, generation, rendering and timing statistics remain attached.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://willpatrick.xyz/cadevalresults_20250422_095709/dashboard_data.json";
const board: Leaderboard = {
 benchmark: "cadeval", url: "https://willpatrick.xyz/cadevalresults_20250422_095709/dashboard_data.json", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases: {'claude-3-5-sonnet-20241022':'claude-3-5-sonnet-october-2024','claude-3-5-haiku-20241022':'claude-3-5-haiku','claude-3-7-sonnet-20250219':'claude-3-7-sonnet','claude-3-haiku-20240307':'claude-3-haiku','gpt-4o-2024-08-06':'gpt-4o-aug-2024'},
 stats: Object.fromEntries([
  ['total_replicates','Total replicates'],['scad_generation_success_count','SCAD generation successes'],['render_success_count','Render successes'],['checks_run_count','Checks run'],['overall_pass_count','Overall passes'],['watertight_pass_count','Watertight passes'],['single_comp_pass_count','Single-component passes'],['bbox_acc_pass_count','Bounding-box accuracy passes'],['volume_pass_count','Volume passes'],['hausdorff_pass_count','Hausdorff passes'],['chamfer_pass_count','Chamfer passes'],
  ['scad_generation_success_rate','SCAD generation success rate'],['render_success_rate','Render success rate'],['overall_pass_rate','Overall pass rate'],['watertight_pass_rate','Watertight pass rate'],['single_comp_pass_rate','Single-component pass rate'],['bbox_acc_pass_rate','Bounding-box accuracy pass rate'],['volume_pass_rate','Volume pass rate'],['hausdorff_pass_rate','Hausdorff pass rate'],['chamfer_pass_rate','Chamfer pass rate'],
  ['avg_chamfer','Average Chamfer distance'],['median_chamfer','Median Chamfer distance'],['avg_hausdorff_95p','Average 95th-percentile Hausdorff distance'],['median_hausdorff_95p','Median 95th-percentile Hausdorff distance'],['avg_generation_time_seconds','Average generation time'],['median_generation_time_seconds','Median generation time'],['avg_render_time_seconds','Average render time'],['median_render_time_seconds','Median render time'],['avg_total_time_seconds','Average total time'],['median_total_time_seconds','Median total time'],['avg_estimated_cost','Average estimated cost'],['median_estimated_cost','Median estimated cost'],['avg_prompt_tokens','Average prompt tokens'],['median_prompt_tokens','Median prompt tokens'],['avg_completion_tokens','Average completion tokens'],['median_completion_tokens','Median completion tokens'],
 ].map(([key,name]) => [key, { name, unit: key.endsWith('_rate') ? '%' : key.includes('cost') ? 'usd' : key.includes('time_seconds') ? 'seconds' : key.includes('tokens') ? 'tokens' : key.includes('distance') || key.includes('chamfer') || key.includes('hausdorff') ? 'score' : 'count', ...(key.endsWith('_rate') ? { better: 'higher' } : key.includes('time_seconds') || key.includes('cost') ? { better: 'lower' } : {}) }])),
 async fetch() {
const d=await fetchJson<any>(FEED);const rows:LeaderboardRow[]=[];
 for(const [name,settings] of Object.entries(d.meta_statistics))for(const [setting,s] of Object.entries(settings as Record<string,any>)){
 if(typeof s.overall_pass_rate!=='number')continue;
 const model=['gemini-1.5-pro'].includes(name)?name+' [snapshot unspecified]':name;
 rows.push({model,score:s.overall_pass_rate,setting:`run ${d.run_id}; ${setting}; source-reported means; check counts retained`,date:'2025-04-22',cost:s.avg_estimated_cost,tokens:s.avg_completion_tokens,metrics:Object.fromEntries(Object.entries(s).filter(([,v])=>typeof v==='number').map(([k,v])=>[k.startsWith('stdev_')?k.slice(6)+'Std':k,v])) as Record<string,number>});}
 if(!rows.length)throw new Error('No run statistics');return rows;
 },
};
export default board;
