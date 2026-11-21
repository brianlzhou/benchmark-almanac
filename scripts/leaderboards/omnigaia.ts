// Read published sizes, model openness and the organizations behind named agents.
// OmniGAIA: overall task accuracy from the official Space results, already in percent. Preserve all
// domain and difficulty scores. Agent methods retain their system identity when the feed does not name
// an exact underlying model; model sizes disambiguate open weights.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/RUC-NLPIR/OmniGAIA-Leaderboard/resolve/main/results.json";
const board: Leaderboard = {
 benchmark: "omnigaia", parts: {
  sport: { name: 'Sport', group: 'Domain' },
  art: { name: 'Art', group: 'Domain' },
  movie: { name: 'Movie', group: 'Domain' },
  food: { name: 'Food', group: 'Domain' },
  easy: { name: 'Easy', group: 'Difficulty' },
  hard: { name: 'Hard', group: 'Difficulty' },
  geo: { name: 'Geography', group: 'Domain' },
  tech: { name: 'Technology', group: 'Domain' },
  hist: { name: 'History', group: 'Domain' },
  fin: { name: 'Finance', group: 'Domain' },
  sci: { name: 'Science', group: 'Domain' },
  med: { name: 'Medium', group: 'Difficulty' },
}, url: "https://huggingface.co/spaces/RUC-NLPIR/OmniGAIA-Leaderboard/resolve/main/results.json", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const data=await fetchJson<{method_name:string;params:string;category:string;organization?:string;scores:Record<string,number|null>}[]>(FEED);const rows:LeaderboardRow[]=[];
for(const r of data){if(typeof r.scores.overall!=='number')continue;let model=r.method_name;
if(r.params&&r.params!=='-'&&!model.includes(r.params))model+=' '+r.params;
if(model==='Gemini-2.5-Pro')model+=' [snapshot unspecified]';
const metrics=Object.fromEntries(Object.entries(r.scores).filter((e):e is [string,number]=>e[0]!=='overall'&&typeof e[1]==='number'));
const harness=/^(Omni|Orchestra|.*Agent)/i.test(r.method_name)?r.method_name:undefined;
const size = r.params?.match(/^([\d.]+)B$/i);
rows.push({model,score:r.scores.overall,harness,metrics,params:size ? Number(size[1]) : undefined,
  agentOrg:harness ? r.organization : undefined,
  open:r.category === 'proprietary' ? false : r.category === 'open_source' ? true : undefined});}
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
