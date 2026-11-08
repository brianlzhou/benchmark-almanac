// XCOPA: published average accuracy across eleven languages, in percent. Human performance is a
// reference, not a model. Parenthesized language values are published fallback results, retained as
// metrics without treating them as independently measured scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/cambridgeltl/xcopa/master/README.md";
const board: Leaderboard = {
 benchmark: "xcopa", url: "https://github.com/cambridgeltl/xcopa", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('avg'));if(!t)throw new Error('XCOPA average table missing');const rows:LeaderboardRow[]=[];
for(const r of t.rows){if(r[0]==='Human')continue;const score=num(r[2]);if(score===undefined)continue;let model=r[0];const setting=/\(Translate test\)/i.test(model)?'Translate test':undefined;model=model.replace(/\s*\(Translate test\)/i,'');const metrics:Record<string,number>={};for(let i=3;i<r.length;i++){const n=num(r[i]);if(n!==undefined)metrics[t.head[i]+(r[i].includes('(')?'_fallback':'')]=n;}rows.push({model,score,setting,metrics});}
return rows;
 },
};
export default board;
