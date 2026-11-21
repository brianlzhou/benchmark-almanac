// Design2Code: CLIP similarity on all 484 webpages is the headline score.
// Block, text, position and color scores remain metrics. Prompts are whole-set settings.
// Read the simulated and human-annotated preference rates for matching configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2403.03163";
const board: Leaderboard = {
 benchmark: "design2code", static: 'paper',
 url: "https://arxiv.org/html/2403.03163",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const all=tables(await fetchText(FEED)).map(grid);
const t=all.find(t=>t[0]?.join('|')==='|Block|Text|Position|Color|CLIP');
 if(!t)throw new Error('Design2Code table missing');let model='';const rows:LeaderboardRow[]=[];
 for(const r of t.slice(1)){if(new Set(r).size===1){model=r[0];continue;}if(r.length!==6||num(r[5])===undefined)continue;
 const fine=model==='Finetuned Models';rows.push({model:fine?r[0]:model,score:num(r[5])!,setting:fine?undefined:r[0],metrics:{block:num(r[1])!,text:num(r[2])!,position:num(r[3])!,color:num(r[4])!}});}
 for (const table of all.filter(t=>t[0]?.[0]==='Model' && t[0]?.[1]?.startsWith('Simulated'))) {
   for (const [label,simulated,annotated] of table.slice(1)) {
     const row=rows.find(r=>[r.model,r.setting].filter(Boolean).join(' ')===label);
     if (!row?.metrics) continue;
     const sim=num(simulated), human=num(annotated);
     if (sim!==undefined) row.metrics.simulatedWinRate=sim;
     if (human!==undefined) row.metrics.annotatedWinOrTieRate=human;
   }
 }
 for (const row of rows) {
   const size=row.model.match(/-(\d+(?:\.\d+)?)B(?:$|\b)/i);
   if (size) row.params=Number(size[1]);
 }
 return checked(rows,23);
 },
};
export default board;
