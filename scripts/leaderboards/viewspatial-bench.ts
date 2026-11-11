// ViewSpatial-Bench: Table 2 Overall is zero-shot accuracy across all tasks. Camera and person task scores remain metrics.
// Random and improvement references are excluded. The learned Multi-View Spatial Model is retained as its own model.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2505.21500";
const board: Leaderboard = {
 benchmark: "viewspatial-bench",
 url: "https://arxiv.org/html/2505.21500",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('Camera-based Tasks'));
 if(!t)throw new Error('ViewSpatial table missing');
 return checked(t.filter(r=>r.length===9&&num(r[8])!==undefined&&!/Random|Improvement/.test(r[0])).map(r=>({model:r[0].replace(/\s*\[[^\]]+\]/g,'').replace(/ \((\d+B)\)/,'-$1').trim(),score:num(r[8])!,setting:'zero-shot',metrics:Object.fromEntries(['cameraRelativeDirection','cameraObjectOrientation','cameraAverage','personObjectOrientation','personRelativeDirection','sceneSimulation','personAverage'].map((k,i)=>[k,num(r[i+1])!]))})),12);
 },
};
export default board;
