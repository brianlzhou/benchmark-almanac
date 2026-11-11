// CMMMU: use the published Test (11K) accuracy percentage.
// Validation is a smaller subset and remains a secondary metric when present.
// Frequent-choice and random-choice baselines are excluded; configuration markers remain in model labels.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/CMMMU-Benchmark/CMMMU/main/README.md";
const board: Leaderboard = {
 benchmark: "cmmmu", url: "https://github.com/CMMMU-Benchmark/CMMMU", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.some(h=>h.includes('Val (900)')));if(!t)throw new Error('Missing results');
 return t.rows.filter(r=>!/(Frequent|Random) Choice/i.test(r[0])).flatMap(r=>[2].flatMap(i=>{const score=num(r[i]);if(score===undefined)return [];const model=r[0].replace(/\*/g,'').trim();return [{model,score,metrics:num(r[1]) === undefined ? undefined : {validation:num(r[1])!}}];}));
 },
};
export default board;
