// Read recorded-bug resolution, Simple and Hard results, per-instance cost and open-source groups.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/2608.04682";
const board: Leaderboard = {benchmark:"active-swe", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 reference:["Claude Code"], parts:{simple:{name:"Simple",group:"Difficulty"},hard:{name:"Hard",group:"Difficulty"}},
 stats:{
  localizationRecall:{name:"Localization recall",unit:"%",better:"higher"},
  localizationPrecision:{name:"Localization precision",unit:"%",better:"higher"},
  potentialCount:{name:"Potential bug test count",unit:"count"},
  testValidity:{name:"Test validity",unit:"%",better:"higher",note:"Percentage of generated tests that exhibit fail-to-pass behavior."},
  revealed:{name:"Potential bugs revealed",unit:"%",better:"higher",note:"Percentage of potential bugs supported by valid test evidence."},
  simpleRecall:{name:"Simple recall",unit:"%",better:"higher"},
  simplePrecision:{name:"Simple precision",unit:"%",better:"higher"},
  simplePotentialCount:{name:"Simple potential bug test count",unit:"count"},
  simpleTestValidity:{name:"Simple test validity",unit:"%",better:"higher"},
  simpleRevealed:{name:"Simple potential bugs revealed",unit:"%",better:"higher"},
  hardRecall:{name:"Hard recall",unit:"%",better:"higher"},
  hardPrecision:{name:"Hard precision",unit:"%",better:"higher"},
  hardSubResolved:{name:"Hard subtask resolved rate",unit:"%",better:"higher"},
  hardPotentialCount:{name:"Hard potential bug test count",unit:"count"},
  hardTestValidity:{name:"Hard test validity",unit:"%",better:"higher"},
  hardRevealed:{name:"Hard potential bugs revealed",unit:"%",better:"higher"},
 },
 async fetch() {
  const tables=paperTables(await paperHtml(URL)).map(grid);
  const table=tables.find(t=>JSON.stringify(t[0]) === "[\"Model\",\"Recorded\",\"Recorded\",\"Recorded\",\"Potential\",\"Potential\",\"Potential\"]" && JSON.stringify(t[1]) === "[\"Model\",\"LR\",\"LP\",\"Resolved\",\"Count\",\"TV\",\"Revealed\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  const costs = new Map<string,number>();
  const costTable = tables.find(t => t[1]?.join('|') === 'Model|Resolved|Revealed|Cost');
  for (const [model,,,cost] of costTable?.slice(2) ?? []) {
    if (/^\$[\d.]+$/.test(cost)) costs.set(model, Number(cost.slice(1)));
  }
  const splits = new Map<string,Record<string,number>>();
  for (const t of tables) {
    const title = t[1]?.join('|');
    const hard = title === 'Model|LR|LP|Res.|Sub Res.|Count|TV|Revealed';
    if (!hard && (t === table || title !== 'Model|LR|LP|Resolved|Count|TV|Revealed')) continue;
    const split = hard ? 'hard' : 'simple';
    const keys = [split+'Recall', split+'Precision', split, ...(hard ? ['hardSubResolved'] : []),
      split+'PotentialCount', split+'TestValidity', split+'Revealed'];
    for (const [model,...values] of t.slice(2)) {
      const metrics = splits.get(model) ?? {};
      values.forEach((value,i) => { if (/^[\d.]+$/.test(value) && keys[i]) metrics[keys[i]] = Number(value); });
      splits.set(model, metrics);
    }
  }
  let open: boolean | undefined;
  for(const c of table.slice(1)) {
   if (c[0] === 'Open-Source Models') open = true;
   if (c[0] === 'Closed-Source Models') open = false;
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[3]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[1, "localizationRecall"], [2, "localizationPrecision"], [4, "potentialCount"], [5, "testValidity"], [6, "revealed"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   out.push({model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[3].replace('%','')),open,harness:"Claude Code",cost:costs.get(c[0]),metrics:{...metrics,...splits.get(c[0])}});
  }
  return checked(out,3);
 }
};
export default board;
