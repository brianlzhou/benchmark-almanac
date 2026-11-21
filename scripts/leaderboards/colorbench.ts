// Published P & R overall score with perception and reasoning tasks ranked separately.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2504.10514";
const board:Leaderboard={benchmark:"colorbench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){
 const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"\",\"Color Perception\",\"Color Perception\",\"Color Perception\",\"Color Reasoning\",\"Color Reasoning\",\"Color Reasoning\",\"Color Reasoning\",\"Color Reasoning\",\"Color Reasoning\",\"Color Reasoning\",\"P & R\",\"Robustness\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 const keys = ['colorRecognition','colorExtraction','objectRecognition','colorProperties','colorComparison',
   'colorCounting','objectCounting','colorIllusion','colorMimicry','colorBlindness'];
 board.parts = Object.fromEntries(keys.map((key,i) => [key,{name:t[1][i+1],group:t[0][i+1]}]));
 let open:boolean|undefined;
 for(const c of t.slice(2)){if(/^VLMs:/.test(c[0]))open=/Proprietary/.test(c[0])?false:undefined;else if(/Human Evaluation/.test(c[0]))open=undefined;const raw=c[11]?.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:%|\s|$)/);if(!raw)continue;
 const metrics:Record<string,number>={};
 keys.forEach((key,i) => {
   const match = c[i+1]?.match(/^(-?\d+(?:\.\d+)?)(?:%|\s|$)/);
   if (match) metrics[key] = Number(match[1]);
 });
 for(const [i,key] of [[12, "robustness"]] as [number,string][]){const v=Number(c[i]);if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
 out.push({model:c[0].replace(/\s*\(CoT\)/g,''),setting:c[0].includes('(CoT)')?'CoT':undefined,score:Number(raw[1])*1,open,metrics});
 }return checked(out,3);
 }};export default board;
