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
 async fetch() {
const d=await fetchJson<any>(FEED);const rows:LeaderboardRow[]=[];
 for(const [name,settings] of Object.entries(d.meta_statistics))for(const [setting,s] of Object.entries(settings as Record<string,any>)){
 if(typeof s.overall_pass_rate!=='number')continue;
 const model=['gemini-1.5-pro'].includes(name)?name+' [snapshot unspecified]':name;
 rows.push({model,score:s.overall_pass_rate,setting:`run ${d.run_id}; ${setting}; source-reported means; check counts retained`,date:'2025-04-22',cost:s.avg_estimated_cost,tokens:s.avg_completion_tokens,metrics:Object.fromEntries(Object.entries(s).filter(([,v])=>typeof v==='number')) as Record<string,number>});}
 if(!rows.length)throw new Error('No run statistics');return rows;
 },
};
export default board;
