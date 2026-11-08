// QIVD: answer correctness percentage, with streaming and offline setups kept separate. Preserve
// the reported plus/minus spread and the other language metrics without treating the spread as a CI.
// Human references are excluded; undated API names are not assigned snapshots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://q-ivd.github.io/";
const board: Leaderboard = {
 benchmark: "qivd", url: "https://q-ivd.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const ts=tables(await fetchText(FEED)).filter(t=>t[0]?.[1]?.text.startsWith('Corr.'));if(ts.length!==2)throw new Error('Expected streaming and offline tables');const rows:LeaderboardRow[]=[];
for(const [i,t] of ts.entries())for(const r of t.slice(1)){if(/^Human/i.test(r[0]?.text??''))continue;const score=num(r[1]?.text);if(score===undefined)continue;let model=r[0].text;if(/^(GPT-4o|Gemini[- ]1\.5[- ](?:Pro|Flash))$/i.test(model))model+=' [snapshot unspecified]';const metrics:Record<string,number>={};const spread=num(r[1].text.split('±')[1]);if(spread!==undefined)metrics.reportedSpread=spread;for(let j=2;j<r.length;j++){const v=num(r[j].text);if(v!==undefined)metrics[t[0][j].text.replace(/ ↑/,'')]=v;}rows.push({model,score,setting:i===0?'Streaming':'Offline',metrics});}
return rows;
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
