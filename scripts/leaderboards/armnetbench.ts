// ArmnetBench v0.1 reports manipulation task success across seven policies under a shared 50-demo budget.
// The published HTML bar chart gives strict success across all 12 tasks. Task scores are metrics.
// Generic policy labels retain their source identity without guessing architecture checkpoints.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://armnet-dev.github.io/armnetbench-v0.1/";
const board: Leaderboard = {
 benchmark: "armnetbench", url: "https://armnet-dev.github.io/armnetbench-v0.1/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const html=await fetchText(FEED);const rows:LeaderboardRow[]=[];
for(const m of html.matchAll(/<div class="bar-row[^"]*">([\s\S]*?)<strong>([\d.]+)%<\/strong>/g)){
 const model=text(m[1].match(/<span class="policy">([\s\S]*?)<\/span>/)?.[1]??'');
 if(model)rows.push({model,score:Number(m[2]),setting:'50 demonstrations',metrics:{rollouts:30,demonstrations:50}});
}
const t=tables(html)[0];if(t?.[0]?.[0]?.text!=='Task')throw new Error('No policy matrix');
for(const r of t.slice(1)){if(r.length===1)continue;for(let i=1;i<r.length;i++){const score=num(r[i].text);const row=rows.find(x=>x.model===t[0][i].text);if(row&&score!==undefined)row.metrics![r[0].text]=score;}}
if(rows.length!==7)throw new Error('Expected seven published overall policy scores');return rows;
 },
};
export default board;
