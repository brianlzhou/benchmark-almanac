// MotionBench: use Test average accuracy, in percent. Keep Dev accuracy as a secondary metric.
// Preserve frame budgets as settings and
// category scores as metrics. Model cells include a separate affiliation, which is not part of the name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://motion-bench.github.io/";
const board: Leaderboard = {
 benchmark: "motionbench", url: "https://motion-bench.github.io", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Test Avg (%)'));if(!t)throw new Error('MotionBench table missing');
const rows: LeaderboardRow[]=[];
for(const r of t.slice(1)) {
 if(r.length!==13)continue;
 const model=text(r[1].html.split(/<p\b|<br\s*\/?\s*>/i)[0]);
 const metrics:Record<string,number>={};for(let i=7;i<13;i++){const v=num(r[i].text);if(v!==undefined)metrics[t[0][i].text]=v;}
 for(const [col,label] of [[5,'Dev'],[6,'Test']] as const){const score=num(r[col].text);if(score===undefined)continue;rows.push({model,score,setting:`${label}; frames: ${r[2].text}`,metrics});}
}
if(!rows.length)throw new Error('No motion results');
return rows.filter(r => r.setting!.startsWith('Test; ')).map(r => {
 const setting=r.setting!.replace('Test; ','');
 const dev=rows.find(x => x.model===r.model && x.setting===`Dev; ${setting}`);
 return {...r,setting,metrics:{...r.metrics,...(dev ? {dev:dev.score} : {})}};
});
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
