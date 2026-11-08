// MM-IFEval: Table 3 Avg. is accuracy over all problems, not the average across unrelated benchmarks.
// Compose-level and perception-level accuracies remain metrics. Fine-tuned models retain their training suffix.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2504.07957";
const board: Leaderboard = {
 benchmark: "mm-ifeval",
 url: "https://arxiv.org/html/2504.07957",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.join('|')==='Model|Param|C-Level|P-Level|Avg.');
 if(!t)throw new Error('MM-IFEval table missing');
 let base='';const out:LeaderboardRow[]=[];
 for(const r of t.slice(1)) {if(r.length!==5||num(r[4])===undefined)continue;
 let model=r[0].replace(/\s*\[\d+\]/g,'').trim();
 if(model.startsWith('+'))model=base+' '+model;else base=model;
 model=model.replace('GPT-4o (20240806)','gpt-4o-2024-08-06').replace('Claude-3.5V-Sonnet','Claude-3.5-Sonnet');
 out.push({model,score:num(r[4])!,metrics:{compose:num(r[2])!,perception:num(r[3])!}});}
 return checked(out,15);
 },
};
export default board;
