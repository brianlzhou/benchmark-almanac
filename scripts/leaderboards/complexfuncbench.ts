// ComplexFuncBench: Overall Success Rate in percent from the official README. Keep call accuracy,
// completeness and correctness as separate metrics; dated model names identify exact snapshots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/zai-org/ComplexFuncBench/main/README.md";
const board: Leaderboard = {
 benchmark: "complexfuncbench", url: "https://github.com/zai-org/ComplexFuncBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'Claude-3.5-Sonnet (20241022)':'claude-3-5-sonnet-october-2024','GPT-4o (2024-08-06)':'gpt-4o-aug-2024','GPT-4-Turbo (2024-04-09)':'gpt-4-turbo-apr-2024','Claude-3.5-Haiku (20241022)':'claude-3-5-haiku'},
 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Overall Success Rate'));if(!t)throw new Error('Success rate table missing');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[1]);if(score===undefined)continue;rows.push({model:r[0],score,metrics:{callAccuracy:num(r[2])!,completeness:num(r[3])!,correctness:num(r[4])!}});}
return rows;
 },
};
export default board;
