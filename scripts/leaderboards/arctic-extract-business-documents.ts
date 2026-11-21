// Arctic-Extract evaluates business-document extraction across QA, table, visual-text and multilingual-text tasks.
// The headline is the paper's QA score, the first metric in its main comparison table.
// This importer reads Table 1 from the authors' arXiv HTML paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2511.16470v1';
const board:Leaderboard={benchmark:'arctic-extract-business-documents',static:'paper',url:FEED,feed:FEED,terms:'The authors publish the paper under arXiv terms at https://arxiv.org/terms.',parts:{qa:{name:'QA'},tableExtraction:{name:'Table extraction'},visualText:{name:'Visual text'},multilingualText:{name:'Multilingual text'}},async fetch(){
 const h=await fetchText(FEED); const fig=h.match(/Table 1:[\s\S]*?<\/figure>/i)?.[0]||''; if(!fig.includes('Arctic-Extract'))throw new Error('Arctic-Extract Table 1 missing');
 const plain=fig.replace(/<[^>]+>/g,' ').replace(/\s+/g,' '); const names=['Arctic-Extract','Arctic-TILT','Claude 4 Sonnet','GPT5','LLama 3.1 405B','LLama 3.1 8B','LLama 4 Scout','Mistral 7B','Pixtral 12B','Qwen 2.5-VL']; const out:LeaderboardRow[]=[];
 for(const name of names){const m=plain.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+([0-9.]+|–)\\s+([0-9.]+|–)\\s+([0-9.]+|–)\\s+([0-9.]+|–)')); if(!m)continue; const v=m.slice(1).map(x=>x==='–'?undefined:Number(x)); if(v[0]===undefined)continue; const metrics:Record<string,number>={}; ['qa','tableExtraction','visualText','multilingualText'].forEach((k,i)=>{if(v[i]!==undefined)metrics[k]=v[i]!}); out.push({model:name,score:v[0]!,metrics});}
 return checked(out,2);
}}; export default board;
