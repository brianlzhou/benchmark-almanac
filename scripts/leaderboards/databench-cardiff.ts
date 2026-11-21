// DataBench tests tabular question answering over 65 datasets.
// Table 5 reports average accuracy by prompt and model, with answer-type metrics retained.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://huggingface.co/datasets/cardiffnlp/databench/resolve/main/Databench-LREC-Coling-2024.pdf';
const board:Leaderboard={benchmark:'databench-cardiff',url:'https://huggingface.co/datasets/cardiffnlp/databench',feed,static:'paper',parts:{boolean:'Boolean',category:'Category',number:'Number',listCategory:'List category',listNumber:'List number'},terms:'The authors publish the paper through the ACL Anthology and dataset terms at https://huggingface.co/datasets/cardiffnlp/databench.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 5: Accuracy by type of answer')) throw new Error('Missing DataBench Table 5');
 const vals=[['codellama-7b','Code Prompt 1',27.4,45.8,16.8,43.3,14.2,17.2],['codellama-13b','Code Prompt 1',31.0,53.4,25.2,46.7,18.8,11.1],['chatgpt3.5','Code Prompt 1',63.0,52.7,73.3,75.9,56.7,56.5],['codellama-7b','Code Prompt 2',30.3,45.0,23.3,49.8,16.5,16.8],['codellama-13b','Code Prompt 2',33.1,54.6,27.1,50.6,16.9,16.4],['chatgpt3.5','Code Prompt 2',55.7,46.6,64.5,74.3,47.1,45.8],['llama-2-7b','Z-ICL Prompt 1',14.4,38.0,19.4,10.5,3.1,.8],['llama-2-13b','Z-ICL Prompt 1',19.3,56.6,21.7,13.6,3.9,.8],['chatgpt3.5','Z-ICL Prompt 1',32.7,67.4,34.5,34.2,13.2,14.0],['llama-2-7b','Z-ICL Prompt 2',14.8,38.4,21.7,8.9,4.3,.8],['llama-2-13b','Z-ICL Prompt 2',20.7,60.9,23.3,14.8,2.7,1.6],['chatgpt3.5','Z-ICL Prompt 2',33.4,65.5,36.8,31.5,18.7,14.3],['llama-2-7b','Z-ICL Plain Text',14.4,33.9,4.2,5.0,undefined,undefined],['llama-2-13b','Z-ICL Plain Text',20.0,54.8,1.6,3.8,undefined,undefined]] as const;
 return checked(vals.map(([model,setting,score,boolean,category,number,listCategory,listNumber])=>({model,setting,score,metrics:{boolean,category,number,...(listCategory===undefined?{}:{listCategory}),...(listNumber===undefined?{}:{listNumber})}})),14);
}}; export default board;
