// NExT-QA: validation-set accuracy in percent for GloVe and BERT-FT text representations. Preserve
// causal, temporal and descriptive question accuracy. The human reference is excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/doc-doc/NExT-QA/main/README.md";
const board: Leaderboard = {
 benchmark: "next-qa", url: "https://github.com/doc-doc/NExT-QA", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Acc@C'));if(!t)throw new Error('NExT-QA validation table missing');const rows:LeaderboardRow[]=[];
for(const r of t.rows){if(/^Human/i.test(r[0]))continue;for(const offset of [1,6]){const score=num(r[offset+4]);if(score===undefined)continue;rows.push({model:r[0].replace(/\s*\([^)]*\)$/,''),score,setting:'Validation; '+r[offset],metrics:{causal:num(r[offset+1])!,temporal:num(r[offset+2])!,descriptive:num(r[offset+3])!}});}}
return rows;
 },
};
export default board;
