// TAT-QA nonhuman submission F1 percentages, with exact match retained separately.
// Specialized systems retain their published identities.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://nextplusplus.github.io/TAT-QA/";
const board: Leaderboard = {
 benchmark: "tat-qa", url: "https://nextplusplus.github.io/TAT-QA/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.[4]?.text==='F1');if(!t)throw new Error('Missing TAT-QA table');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){const model=r[1]?.text,score=num(r[4]?.text);if(!model||/Human Performance/i.test(model)||score===undefined)continue;const em=num(r[3]?.text);rows.push({model,score,metrics:em===undefined?undefined:{exactMatch:em}});}return rows;
 },
};
export default board;
