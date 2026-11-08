// CodeCap-Bench uses overall fine-grained visual retention as its headline score.
// The static main table retains harness identity and five component metrics. Cost/token charts are image-only.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://codecap-bench.github.io/";
const board: Leaderboard = {
 benchmark: "codecap-bench", url: "https://codecap-bench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED))[0]; if(!t?.[0]?.some(c=>c.text==='Harness'))throw new Error('Missing main table');
 return t.filter(r=>r.length===8 && num(r[7].text)!==undefined).map(r=>({model:r[0].text,harness:r[1].text==='-'?undefined:r[1].text,setting:r[1].text==='-'?'Non-agentic':'Agentic',score:num(r[7].text)!,metrics:Object.fromEntries(['videoSuccess','visualSimilarity','spatioTemporalIoU','dynamicRetention','staticRetention'].map((k,i)=>[k,num(r[i+2].text)!]))}));
 },
};
export default board;
