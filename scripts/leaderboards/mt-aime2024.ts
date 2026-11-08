// MT-AIME2024: the MCLM dataset card reports accuracy over its 55-language translation of AIME 2024.
// Read only the MT-AIME2024 column, not the four-benchmark average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/amphora/MCLM/resolve/main/README.md";
const board: Leaderboard = {
 benchmark: "mt-aime2024", url: "https://huggingface.co/datasets/amphora/MCLM/resolve/main/README.md", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head[0]==='Model'&&t.head.includes('MT-AIME2024'));if(!t)throw new Error('MCLM results missing');const i=t.head.indexOf('MT-AIME2024');return t.rows.flatMap(r=>{const score=num(r[i]);return score===undefined?[]:[{model:r[0].replace(/^deepseek-ai_/,''),score,setting:'55-language aggregate'}];});
 },
};
export default board;
