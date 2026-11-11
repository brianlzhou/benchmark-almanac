// SGP-Bench: use Overall accuracy from the default visible SVG table, in percent.
// The CAD table is initially hidden. Retain category scores as metrics; exclude random-choice references.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://sgp-bench.github.io/";
const board: Leaderboard = {
 benchmark: "sgp-bench", url: "https://sgp-bench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'GPT-4o-2024-08-06':'gpt-4o-aug-2024','GPT-4o-2024-05-13':'gpt-4o-may-2024'},
 async fetch() {

const ts=tables(await fetchText(FEED)).filter(t=>t[0]?.[3]?.text==='Overall');if(ts.length!==2)throw new Error('Expected two SGP tables');const rows:LeaderboardRow[]=[];
for(const [i,t] of ts.slice(0,1).entries())for(const r of t.slice(1)){if(/^Random/i.test(r[0]?.text??''))continue;const score=num(r[3]?.text);if(score===undefined)continue;const metrics:Record<string,number>={};for(let j=4;j<r.length;j++){const v=num(r[j].text);if(v!==undefined)metrics[t[0][j].text]=v;}rows.push({model:r[0].text,score,date:r[2].text,metrics});}
return rows;
 },
};
export default board;
