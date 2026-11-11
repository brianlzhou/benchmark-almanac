// MaCBench: published Overall Accuracy from the dated Inspect evaluation report.
// The comparison table repeats the same runs, so it supplies reference metrics only.
// Accuracy and standard error are converted from fractions to percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://ukgovernmentbeis.github.io/inspect_evals/evals/macbench/index.html";
const board: Leaderboard = {
 benchmark: "macbench", url: "https://ukgovernmentbeis.github.io/inspect_evals/evals/macbench/index.html", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const ts=tables(await fetchText(FEED)).filter(t=>t[0]?.some(c=>c.text.includes('Overall Accuracy')));const rows:LeaderboardRow[]=[];for(const t of ts){const dated=t[0][0].text==='Date';for(const r of t.slice(1)){const score=num(r[3]?.text);if(score===undefined)continue;const counts=r[2].text.split('/').map(Number);rows.push({model:r[1].text.replace(/^openai\//,''),score:score*100,date:dated?r[0].text:undefined,setting:dated?'Inspect evaluation run':r[0].text,metrics:{samples:counts[0],totalSamples:counts[1],standardError:num(r[4].text)!*100}});}}return rows.filter(r=>r.setting==='Inspect evaluation run'&&r.metrics?.samples===r.metrics?.totalSamples).map(r=>{
  const reference=rows.find(x=>x.model===r.model&&x.setting==='Original MaCBench summary');
  return {...r,setting:undefined,harness:'Inspect Evals',metrics:{...r.metrics,...(reference?{originalAccuracy:reference.score,originalStandardError:reference.metrics!.standardError}:{})}};
});
 },
};
export default board;
