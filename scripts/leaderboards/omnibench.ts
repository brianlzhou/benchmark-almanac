// OmniBench: overall accuracy in percent for each of four input conditions. Preserve all numeric
// category scores and model-size labels. Missing values remain missing, not zero.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://m-a-p.ai/OmniBench/leaderboard_data.json";
const board: Leaderboard = {
 benchmark: "omnibench", url: "https://m-a-p.ai/OmniBench/leaderboard_data.json", feed: FEED,
 aliases: {'GPT4-o (0806)':'gpt-4o-aug-2024','GPT4-o-mini':'gpt-4o-mini','GPT-4V-0409':'gpt-4-turbo-apr-2024'},
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

type Entry={info:{name:string;size:string;date?:string}} & Record<string,any>;
const data=await fetchJson<{leaderboardData:Entry[]}>(FEED);const rows:LeaderboardRow[]=[];
for(const r of data.leaderboardData)for(const setting of ['image-audio','textual_image','textual_audio','textual_image-audio']){
 const v=r[setting];if(typeof v?.overall!=='number')continue;let model=r.info.name;if(r.info.size&&r.info.size!=='-'&&!model.includes(r.info.size))model+=' '+r.info.size;
 if(/^(GPT-4o|GPT-4|Gemini[- ]1\.5[- ](?:Pro|Flash))$/i.test(model))model+=' [snapshot unspecified]';
 rows.push({model,score:v.overall,setting,metrics:Object.fromEntries(Object.entries(v).filter(([k,n])=>k!=='overall'&&typeof n==='number')) as Record<string,number>});}
if(!rows.length)throw new Error('No OmniBench results');return rows;
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
