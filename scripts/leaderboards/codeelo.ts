// Published whole-benchmark headline result. Sub-scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2501.01257";
const board:Leaderboard={benchmark:"codeelo",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){
 const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Model\",\"\",\"Elo Rating\",\"Elo Rating\",\"Elo Rating\",\"Elo Rating\",\"Elo Rating\",\"Pass Rate for\",\"Pass Rate for\",\"Pass Rate for\",\"Pass @\",\"Pass @\",\"Pass @\",\"Pass @\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 let open:boolean|undefined;
 for(const c of t.slice(2)){if(/Proprietary LLMs/.test(c[0]))open=false;else if(/Open-source (?:LLMs|Models)/.test(c[0]))open=true;const raw=c[2]?.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:%|\s|$)/);if(!raw)continue;
 const metrics:Record<string,number>={};
 for(const [i,key] of [[10, "pass1"], [11, "pass2"], [12, "pass4"], [13, "pass8"]] as [number,string][]){const v=Number(c[i]);if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
 out.push({model:c[0],score:Number(raw[1])*1,open,metrics});
 }return checked(out,3);
 }};export default board;
