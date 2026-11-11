// WorldSense: average accuracy across the official real-world omnimodal question set, in percent.
// Input modalities are whole-benchmark configurations. Model size belongs to identity;
// only input modality and explicit thinking effort remain settings, with domains in metrics.
// Affiliations beneath model names are not part of the model identity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://jaaackhongggg.github.io/WorldSense";
const board: Leaderboard = {
 benchmark: "worldsense-omnimodal", url: "https://jaaackhongggg.github.io/WorldSense", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Average'));if(!t)throw new Error('WorldSense table missing');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){
 if(r.length!==13)continue;const score=num(r[12].text);if(score===undefined)continue;
 let model=text(r[1].html.split(/<p\b|<br\s*\/?\s*>/i)[0]);
 const effort=model.match(/ (No-Thinking|Adaptive-Thinking|Thinking)$/i)?.[1];
 if(effort)model=model.slice(0,-effort.length).trim();
 if(/^[\d.]+B$/i.test(r[2].text)&&!model.toLowerCase().includes(r[2].text.toLowerCase()))model+=' '+r[2].text;
 const metrics:Record<string,number>={};for(let i=4;i<12;i++){const v=num(r[i].text);if(v!==undefined)metrics[t[0][i].text]=v;}
 rows.push({model,score,setting:[`modality ${r[3].text}`,effort].filter(Boolean).join('; '),metrics});
}
if(!rows.length)throw new Error('No WorldSense results');return rows;
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
