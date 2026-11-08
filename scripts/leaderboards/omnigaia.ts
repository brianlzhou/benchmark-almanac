// OmniGAIA: overall task accuracy from the official Space results, already in percent. Preserve all
// domain and difficulty scores. Agent methods retain their system identity when the feed does not name
// an exact underlying model; model sizes disambiguate open weights.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/RUC-NLPIR/OmniGAIA-Leaderboard/resolve/main/results.json";
const board: Leaderboard = {
 benchmark: "omnigaia", url: "https://huggingface.co/spaces/RUC-NLPIR/OmniGAIA-Leaderboard/resolve/main/results.json", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const data=await fetchJson<{method_name:string;params:string;category:string;scores:Record<string,number|null>}[]>(FEED);const rows:LeaderboardRow[]=[];
for(const r of data){if(typeof r.scores.overall!=='number')continue;let model=r.method_name;
if(r.params&&r.params!=='-'&&!model.includes(r.params))model+=' '+r.params;
if(model==='Gemini-2.5-Pro')model+=' [snapshot unspecified]';
const metrics=Object.fromEntries(Object.entries(r.scores).filter((e):e is [string,number]=>e[0]!=='overall'&&typeof e[1]==='number'));
const harness=/^(Omni|Orchestra|.*Agent)/i.test(r.method_name)?r.method_name:undefined;
rows.push({model,score:r.scores.overall,harness,metrics});}
if(!rows.length)throw new Error('No OmniGAIA results');return rows;
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
