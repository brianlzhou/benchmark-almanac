// MMLU-STEM: the official MMLU Test Leaderboard STEM accuracy percentage, not its overall average.
// Preserve model-size and few-shot/fine-tuning configurations; exclude the random baseline.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/hendrycks/test/master/README.md";
const board: Leaderboard = {
 benchmark: "mmlu-stem", url: "https://github.com/hendrycks/test", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('STEM'));if(!t)throw new Error('MMLU STEM table missing');const i=t.head.indexOf('STEM');return t.rows.flatMap(r=>{if(/^Random/i.test(r[0]))return[];const score=num(r[i]);if(score===undefined)return[];const config=r[0].match(/\(([^)]+)\)$/)?.[1];return [{model:r[0],score,setting:config}];});
 },
};
export default board;
