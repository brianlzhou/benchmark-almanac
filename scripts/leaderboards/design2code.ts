// Design2Code: CLIP similarity on all 484 webpages is the headline score.
// Block, text, position and color scores remain metrics. Prompts are whole-set settings.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2403.03163";
const board: Leaderboard = {
 benchmark: "design2code",
 url: "https://arxiv.org/html/2403.03163",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(grid).find(t=>t[0]?.join('|')==='|Block|Text|Position|Color|CLIP');
 if(!t)throw new Error('Design2Code table missing');let model='';const rows:LeaderboardRow[]=[];
 for(const r of t.slice(1)){if(new Set(r).size===1){model=r[0];continue;}if(r.length!==6||num(r[5])===undefined)continue;
 const fine=model==='Finetuned Models';rows.push({model:fine?r[0]:model,score:num(r[5])!,setting:fine?undefined:r[0],metrics:{block:num(r[1])!,text:num(r[2])!,position:num(r[3])!,color:num(r[4])!}});}
 return checked(rows,23);
 },
};
export default board;
