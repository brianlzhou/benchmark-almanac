// TravelPlanner: Test Final Pass Rate counts plans meeting every constraint.
// Two-stage and sole-planning modes apply to the same full test set.
// Other test metrics remain metrics. Validation scores do not become headline rows.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
const FEED = "https://arxiv.org/html/2402.01622";
const board: Leaderboard = {
 benchmark: "travelplanner", static: 'paper',
 url: "https://arxiv.org/html/2402.01622",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const published = flatPaperTables(await fetchText(FEED)).map(grid);
const difficulty = published.find(t => t[0]?.[0] === 'Constraint Type');
const t=published.find(t=>t[0]?.[7]==='Test (#1,000)'&&t[1]?.[12]==='Final Pass Rate');if(!t)throw new Error('TravelPlanner test table missing');const rows:LeaderboardRow[]=[];let mode='';
 for(const r of t.slice(3)){if(new Set(r).size===1){mode=r[0];continue;}if(!mode||num(r[12])===undefined)continue;let model=r[0].replace(/\s*\(.*$/,'').replace('Direct{}_{\\rm Gemini~Pro}','Direct Gemini Pro');let prompt='';const m=model.match(/^(Direct|CoT|ReAct|Reflexion) (.*)$/);if(m){prompt=m[1];model=m[2];}if(model==='Gemini Pro')model+=' (snapshot unspecified)';const extra: Record<string, number> = {};
 for (const [i, key] of ['Delivery','CommonsenseMicro','CommonsenseMacro','HardMicro','HardMacro','Final'].entries()) {
   const value = num(r[i + 1]); if (value !== undefined) extra['validation' + key] = value;
 }
 if (model === 'GPT-4-Turbo' && (mode === 'Two-stage' || prompt === 'Direct') && difficulty) {
   const offset = mode === 'Two-stage' ? 1 : 4;
   for (const entry of difficulty.slice(2)) {
     if (new Set(entry).size === 1) continue;
     for (const [j, name] of ['Easy', 'Medium', 'Hard'].entries()) {
       const value = num(entry[offset+j]); if (value === undefined) continue;
       const key = name.toLowerCase();
       if (entry[0] === 'Final Pass Rate') {
         extra[key] = value;
         (board.parts ??= {})[key] = {name, group: 'Difficulty'};
       } else extra[key + entry[0].replace(/[^a-z0-9]/gi,'')] = value;
     }
   }
 }
 rows.push({model,score:num(r[12])!,setting:[mode,prompt].filter(Boolean).join(', '),metrics:{...extra,delivery:num(r[7])!,commonsenseMicro:num(r[8])!,commonsenseMacro:num(r[9])!,hardMicro:num(r[10])!,hardMacro:num(r[11])!}});}return checked(rows,12);
 },
};
export default board;
