// The appendix dates Mistral Large 2 to September 2024, before the November model.
// AgentHarm: harmful-behavior Harm Score is the headline, lower is better.
// Attack modes apply to the full harmful set. Conditional harm and benign scores remain metrics.
// Use the complete main appendix table, excluding the separate easy subset.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { flatPaperTables } from '../lib/boards/arxiv-h2.ts';
const FEED = "https://arxiv.org/html/2410.09024";
const board: Leaderboard = {
 benchmark: "agentharm",
 url: "https://arxiv.org/html/2410.09024",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=flatPaperTables(await fetchText(FEED)).map(grid);const t=ts.find(t=>t[1]?.join('|')==='Model|Attack|Harm Score|Refusals|Non-refusal Harm Score|Non-refusal Score');
 if(!t)throw new Error('AgentHarm complete table missing');
 const rows:LeaderboardRow[]=t.slice(2).filter(r=>num(r[2])!==undefined).map(r=>({model:r[0],score:num(r[2])!,setting:`${r[1]} attack; Standard prompt`,metrics:{refusal:num(r[3])!,conditionalHarm:num(r[4])!,benign:num(r[5])!}}));
 const prompts=ts.find(t=>t[0]?.[4]==='CoT Prompt');if(!prompts)throw new Error('AgentHarm prompts missing');
 for(const r of prompts.slice(2))for(const [i,p] of [[4,'CoT'],[6,'ReAct'],[8,'Refusal']] as const)if(num(r[i])!==undefined)rows.push({model:r[0],score:num(r[i])!,setting:`${r[1]} attack; ${p} prompt`,metrics:{refusal:num(r[i+1])!}});
 for(const r of rows){if(r.model==='Mistral Large 2')r.model='mistral-large-2-jul-2024';if(r.model==='Mistral Small 2')r.model='Mistral Small 2 (September 2024)';if(r.model==='Sonnet 3.5')r.model='Claude 3.5 Sonnet (snapshot unspecified)';}return checked(rows,39);
 },
};
export default board;
