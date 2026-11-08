// Tau-tau-bench measures builder-model harnesses on 53 tasks.
// Overall is the headline percentage; domain percentages are metrics. Cost is build USD per task, not serve credits.
// The manifest discovers current submissions at every refresh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://sierra-research.github.io/hyper-tau-bench/hyper-submissions/manifest.json";
const board: Leaderboard = {
 benchmark: "tau-tau-bench", url: "https://sierra-research.github.io/hyper-tau-bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const manifest=await fetchJson<any>(FEED);const rows:LeaderboardRow[]=[];for(const id of manifest.submissions){if(!/^[\w.-]+$/.test(id))throw new Error('Invalid submission id');await new Promise(r=>setTimeout(r,1100));const r=await fetchJson<any>(new URL(`${id}/submission.json`,FEED).href);for(const [domain,score]of Object.entries(r.scores)){if(domain!=='overall'||typeof score!=='number')continue;rows.push({model:r.builder.model_name,harness:r.harness.name,score,setting:`${manifest.board_version}; ${r.builder.reasoning_effort}`,date:r.submission_date,cost:r.build_cost_usd,metrics:{...Object.fromEntries(Object.entries(r.scores).filter(([k,v])=>k!=='overall'&&typeof v==='number')),buildTimeMinutes:r.build_time_min,serveCreditRatio:r.serve_credit_ratio}});}}return rows;
 },
};
export default board;
