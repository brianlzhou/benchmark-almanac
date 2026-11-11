// CoQA overall F1 for nonhuman submissions, with in-domain and out-of-domain metrics.
// Preserves system and ensemble identities rather than assigning specialized systems to guessed backbones.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://stanfordnlp.github.io/coqa/";
const board: Leaderboard = {
 benchmark: "coqa", url: "https://stanfordnlp.github.io/coqa/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.at(-1)?.text==='Overall');if(!t)throw new Error('Missing CoQA leaderboard');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){const model=text(r[1]?.html.split(/<p\b/i)[0]??'');const score=num(r[4]?.text);if(!model||/Human Performance/i.test(model)||score===undefined)continue;
 const metrics:Record<string,number>={};for(const [i,k]of [[2,'in-domain F1'],[3,'out-of-domain F1']]as const){const v=num(r[i]?.text);if(v!==undefined)metrics[k]=v;}
 rows.push({model,score,metrics});}return rows;
 },
};
export default board;
