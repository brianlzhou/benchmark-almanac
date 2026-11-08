// SGI-Bench: the site’s SGI-Score averages five scientific-task scores on its 0–100 scale.
// This reproduces the page’s published formula from live inline data without executing page scripts.
// The page defines: "The SGI-Score is the average across these tasks".
// Only complete overview models get rows. The five task scores remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { jsLiteral } from '../lib/html.ts';
const FEED = "https://InternScience.github.io/SGI-Page/";
const board: Leaderboard = {
 benchmark: "sgi-bench",
 url: "https://InternScience.github.io/SGI-Page/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const html=await fetchText(FEED);
  type Entry={model:string;[key:string]:string|number};
  const read=(name:string):Entry[]=>{const at=html.indexOf('const '+name+' =');if(at<0)throw new Error(name+' missing');return jsLiteral<Entry[]>(html,html.indexOf('[',at));};
  const mean=(r:Entry,keys:string[])=>keys.reduce((sum,k)=>sum+Number(r[k]),0)/keys.length;
  const specs:[string,string,(r:Entry)=>number][]=[['DEEP_DATA','Deep Research EM',r=>Number(r.em)],['DEEP_AGENT_DATA','Deep Research EM',r=>Number(r.em)],['IDEA_DATA','Idea Generation',r=>mean(r,['eff','nov','det','feas'])],['DRY_DATA','Dry Experiment PassAll@5',r=>Number(r.p5)],['WET_DATA','Wet Experiment',r=>mean(r,['ss','pa'])],['ER_DATA','Experimental Reasoning',r=>Number(r.mca)]];
  const rows:LeaderboardRow[]=[];const maps:Map<string,number>[]=[];
  for(const [name,setting,pick] of specs){
    const entries=read(name);const map=new Map<string,number>();
    for(const r of entries){const score=pick(r);if(!Number.isFinite(score))continue;map.set(r.model,score);
      const agent=name==='DEEP_AGENT_DATA'?r.model.match(/^(.*?)\((.*?)\)$/):null;
    }
    if(name!=='DEEP_AGENT_DATA')maps.push(map);
  }
  for(const r of read('OVERVIEW_DATA')){
    const scores=maps.map((m,i)=>typeof r['task'+(i+1)]==='number'?Number(r['task'+(i+1)]):m.get(r.model));
    if(scores.some(s=>s===undefined))throw new Error('Incomplete SGI overview '+r.model);
    rows.push({model:r.model,score:(scores as number[]).reduce((a,b)=>a+b,0)/5,metrics:Object.fromEntries(scores.map((s,i)=>['task'+(i+1),s as number]))});
  }
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
