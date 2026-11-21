// Published whole-benchmark headline result. Sub-scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2504.00487";
const board:Leaderboard={benchmark:"fortisavqa", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){
 const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Method\",\"F\",\"Audio QA\",\"Audio QA\",\"Audio QA\",\"Audio QA\",\"Visual QA\",\"Visual QA\",\"Visual QA\",\"Visual QA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"AVQA\",\"All\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(3)){const raw=c[20]?.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:%|\s|$)/);if(!raw)continue;
 const metrics:Record<string,number>={};
 for(const [i,key] of [] as [number,string][]){const v=Number(c[i]);if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
 out.push({model:c[0],score:Number(raw[1])*1,metrics,setting:'MCCD strategy: '+c[1]});
 }return checked(out,3);
 }};export default board;
