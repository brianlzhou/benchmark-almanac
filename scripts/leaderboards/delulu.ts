// Published whole-benchmark headline result. Sub-scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2605.07024";
const board:Leaderboard={benchmark:"delulu",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){
 const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Family\",\"Model\",\"Params\",\"EM \\\\uparrow\",\"ES \\\\uparrow\",\"CB \\\\uparrow\",\"HR \\\\downarrow\",\"pass@1 \\\\uparrow\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){const raw=c[7]?.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:%|\s|$)/);if(!raw)continue;
 const metrics:Record<string,number>={};
 for(const [i,key] of [[3, "exactMatch"], [4, "editSimilarity"], [5, "codeBleu"], [6, "hallucinationRate"]] as [number,string][]){const v=Number(c[i]);if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
 out.push({model:c[1],score:Number(raw[1])*100,params:/^\d+(?:\.\d+)?B$/.test(c[2])?Number(c[2].slice(0,-1)):undefined,metrics});
 }return checked(out,3);
 }};export default board;
