// ComplexNLU: the Hunyuan-A13B README pairs ComplexNLU and Word-Task in each cell. Read the first
// value, which corresponds to ComplexNLU, in percent; never average or combine the two tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan-A13B/main/README.md";
const board: Leaderboard = {
 benchmark: "complexnlu-tencent", url: "https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan-A13B/main/README.md", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'OpenAI-o1-1217':'o1','Qwen3-A22B':'qwen3-235b-a22b'},
 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.rows.some(r=>r[1]?.includes('ComplexNLU')));const r=t?.rows.find(r=>r[1]?.includes('ComplexNLU'));if(!t||!r||!r[1].startsWith('ComplexNLU'))throw new Error('ComplexNLU paired row missing');return t.head.slice(2).flatMap((model,i)=>{const score=num(r[i+2]);return score===undefined?[]:[{model,score}];});
 },
};
export default board;
