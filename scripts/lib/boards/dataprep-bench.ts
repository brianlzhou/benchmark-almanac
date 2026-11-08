// DataPrep-Bench reports six domain averages for generated data. Backbone choice is a run configuration within each domain.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../html.ts';

const FEED = "https://datapreparationbench.github.io/";
const board: Leaderboard = {
 benchmark: "dataprep-bench", url: "https://datapreparationbench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const ts=tables(await fetchText(FEED));const rows:LeaderboardRow[]=[];
 for(let ti=1;ti<=4;ti++){const t=ts[ti];if(t?.[0]?.[0]?.text!=='Generator')throw new Error('Missing construction table');const backbone=ti<=2?'Qwen2.5-7B':'Llama-3.1-8B';let family='';
 for(const r of t.slice(2)){if(r.length<=2){family=r[0].text;continue;}if(r[0].text==='No synthetic training')continue;
 let model=r[0].text;let harness=family;if(model.startsWith('Skill (')){model=model.slice(7,-1);harness='Data-Construction-Skill';}if(model==='Gemini 3.0 Pro')model+=' [snapshot unspecified]';
 const specs: [string,number][] = ti%2? [['Math',8],['General',10],['Finance',14]]:[['Law',3],['Medical',7],['Science',15]];
 const metrics=Object.fromEntries(r.slice(1).flatMap((c,i)=>{const v=num(c.text);return v===undefined?[]:[[`${t[1][i]?.text??'column'}_${i+1}`,v]];}));
 for(const [domain,col] of specs){const score=num(r[col]?.text);if(score!==undefined)rows.push({model,harness,score,setting:`${backbone}; ${domain}; downstream average`,metrics});}}}
 return rows;
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
