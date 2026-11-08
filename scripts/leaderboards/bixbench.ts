// BixBench: the current v1.5 zero-shot baseline file reports accuracy over all 205 questions.
// Answer format and refusal options apply to the whole set. Precision and coverage remain metrics.
// These are zero-shot baselines, not agentic runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://raw.githubusercontent.com/Future-House/BixBench/HEAD/bixbench-v1.5_results/zero_shot_baselines.json";
const board: Leaderboard = {
 benchmark: "bixbench",
 url: "https://raw.githubusercontent.com/Future-House/BixBench/HEAD/bixbench-v1.5_results/zero_shot_baselines.json",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const data=await fetchJson<Record<string,{accuracy:number,precision:number,coverage:number,n_total:number}>>(FEED);
 return checked(Object.entries(data).map(([name,r])=>{const parts=name.split('-grader-');if(parts.length!==2||r.n_total!==205)throw new Error('BixBench schema or version changed');return {model:parts[0].replace('-latest','')+' (snapshot unspecified)',score:r.accuracy*100,setting:'v1.5, zero-shot, '+parts[1],metrics:{precision:r.precision*100,coverage:r.coverage*100}};}),6);
 },
};
export default board;
