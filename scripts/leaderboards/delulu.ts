// Published overall pass@1 and Qwen pass@1 by hallucination type, both in percent.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2605.07024";
const board:Leaderboard={benchmark:"delulu", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 parts: {import: {name: 'Import', group: 'Hallucination type'}, method: {name: 'Method', group: 'Hallucination type'},
   parameter: {name: 'Parameter', group: 'Hallucination type'}, undefinedVariable: {name: 'Undef. Var.', group: 'Hallucination type'}},
 async fetch(){
 const all=paperTables(await paperHtml(URL)).map(grid);
 const split=all.find(t=>t[0]?.[0]==="Type" && t[0]?.[1]==="0.5B");
 const t=all.find(t=>JSON.stringify(t[0])==="[\"Family\",\"Model\",\"Params\",\"EM \\\\uparrow\",\"ES \\\\uparrow\",\"CB \\\\uparrow\",\"HR \\\\downarrow\",\"pass@1 \\\\uparrow\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){const raw=c[7]?.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:%|\s|$)/);if(!raw)continue;
 const metrics:Record<string,number>={};
 for(const [i,key] of [[3, "exactMatch"], [4, "editSimilarity"], [5, "codeBleu"], [6, "hallucinationRate"]] as [number,string][]){const v=Number(c[i]);if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
 if (c[0] === 'Qwen2.5-Coder' && split) {
   const column = split[0].indexOf(c[2]);
   const keys: Record<string,string> = {Import:'import', Method:'method', Parameter:'parameter', 'Undef. Var.':'undefinedVariable'};
   for (const row of split.slice(1)) {
     if (keys[row[0]] && row[column]?.trim() && Number.isFinite(Number(row[column]))) metrics[keys[row[0]]] = Number(row[column]) * 100;
   }
 }
 out.push({model:c[1],score:Number(raw[1])*100,params:/^\d+(?:\.\d+)?B$/.test(c[2])?Number(c[2].slice(0,-1)):undefined,metrics});
 }return checked(out,3);
 }};export default board;
