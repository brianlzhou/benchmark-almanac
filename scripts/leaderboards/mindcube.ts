// MindCube: official Overall accuracy percentage with Rotation, Among and Around as metrics.
// Exclude the two chance/frequency references. Keep specialized spatial systems under their own names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://mind-cube.github.io/";
const board: Leaderboard = {
 benchmark: "mindcube", url: "https://mind-cube.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text.startsWith('Overall'));if(!t)throw new Error('MindCube table missing');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){if(/^Random/i.test(r[0]?.text??''))continue;const score=num(r[1]?.text);if(score===undefined)continue;let model=r[0].text;if(/^(GPT-4o|Gemini[- ]2\.5[- ]Pro)$/i.test(model))model+=' [snapshot unspecified]';rows.push({model,score,metrics:{rotation:num(r[2].text)!,among:num(r[3].text)!,around:num(r[4].text)!}});}
return rows;
 },
};
export default board;
