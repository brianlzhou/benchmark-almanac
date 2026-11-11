// CELLO: average instruction-following score, expressed as a percentage from the official 0–1 CSV
// values. Merge task and constraint metrics by model within each named track; keep Ch_cc, Ch_fs and
// Eg separate. Fetch all six files from the current repository branch with host pacing.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/Abbey4799/CELLO/main/scores/";
const board: Leaderboard = {
 benchmark: "cello", url: "https://github.com/Abbey4799/CELLO", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const rows:LeaderboardRow[]=[];let first=true;
for(const track of ['Ch_cc','Ch_fs','Eg']){const models=new Map<string,LeaderboardRow>();
 for(const kind of ['tasks','constraints']){if(!first)await new Promise(r=>setTimeout(r,1100));first=false;
  const data=parseCsv(await fetchText(`${FEED}${track}_scores_by_${kind}.csv`));
  if(!data[0]||!('Average'in data[0]))throw new Error('CELLO CSV schema changed');
  for(const r of data){const score=num(r.Average);if(!r.model_name||score===undefined)continue;const old=models.get(r.model_name);if(old&&Math.abs(old.score-score*100)>0.001)throw new Error('CELLO task/constraint average mismatch');const row=old??{model:r.model_name,score:score*100,setting:track,metrics:{}};for(const [k,v]of Object.entries(r)){if(k==='model_name'||k==='Average')continue;const n=num(v);if(n!==undefined)row.metrics![k]=n*100;}models.set(r.model_name,row);}
 }
 rows.push(...models.values());
}
if(!rows.length)throw new Error('No CELLO results');return rows;
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
