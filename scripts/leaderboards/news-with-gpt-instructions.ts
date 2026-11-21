// News With GPT Instructions is a financial-news sentiment benchmark with seven original labels.
// This paper converts the labels to three classes and reports accuracy in Table 1.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
const FEED='https://aclanthology.org/2025.finnlp-1.16.pdf';
const board:Leaderboard={benchmark:'news-with-gpt-instructions',static:'paper',url:FEED,feed:FEED,terms:'The ACL Anthology paper is available for research use under its publication terms. Table 1 is credited to the authors.',aliases:{'Llama 2 7B':'llama-2-7b','Llama 2 13B':'llama-2-13b'},async fetch(){
 const text=await pdfText(FEED); const i=text.indexOf('Model                           FPB'); const table=i>=0?text.slice(i,i+1800):''; if(!table.includes('NWGI'))throw new Error('News With GPT Instructions Table 1 missing');
 const specs:[string,string,string][]=[['Llama 2 7B','Directly tuned (expert)','84.81         77.45      87.23      61.06'],['Llama 2 13B','Base (untuned)','38.78         27.64     54.40      40.97'],['Llama 2 13B','Proxy-tuned (Ours)','82.43         76.72     88.02      61.30'],['Llama 2 13B','Directly tuned','85.15         82.91     88.15      63.92']];
 const rows:LeaderboardRow[]=specs.map(([model,setting,nums])=>{const v=nums.trim().split(/\s+/).map(Number);return {model,setting,score:v[3],metrics:{fpb:v[0],fiqaSa:v[1],tfns:v[2]}};}); return rows;
}}; export default board;
