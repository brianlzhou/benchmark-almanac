// All-Angles Bench: published average accuracy, in percent, with the 250-question human comparison
// subset excluded from the full evaluation. Spatial-reasoning systems retain their own names.
// Undated API snapshots are explicitly unlisted rather than assigned to the newest registry release.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://danielchyeh.github.io/All-Angles-Bench/";
const board: Leaderboard = {
 benchmark: "all-angles-bench", url: "https://danielchyeh.github.io/All-Angles-Bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const ts=tables(await fetchText(FEED));const rows:LeaderboardRow[]=[];
for(const t of ts.filter(t=>t[0]?.[1]?.text==='Avg.')) {
 let setting='Full evaluation';
 for(const r of t.slice(1)) {
  if(r.length===1){setting=r[0].text.includes('250')?'Human comparison subset (250 Q&As)':'Full evaluation';continue;}
  const score=num(r[1]?.text);if(score===undefined||/^Human/.test(r[0].text))continue;
  let model=r[0].text.replace(/\s*\([^)]*et al\.[^)]*\)$/,'');
  if(/^(GPT-4o|Gemini-1\.5-(Pro|Flash)|Gemini-2\.0-Flash|Claude-3\.5-Sonnet)$/i.test(model))model+=' [snapshot unspecified]';
  const metrics:Record<string,number>={};for(let i=2;i<r.length;i++){const v=num(r[i].text);if(v!==undefined)metrics[t[0][i].text]=v;}
  if (setting === 'Full evaluation') rows.push({model,score,metrics});
 }
}
if(!rows.length)throw new Error('No All-Angles averages');return rows;
 },
};
export default board;
