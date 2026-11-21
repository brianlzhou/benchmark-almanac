// SemEval 2022 Task 8 measures multilingual news article similarity.
// MTEB reports the cosine Spearman test score across its language and language-pair subsets.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const task='STS22';
const feed='https://mteb-leaderboard-backend.hf.space/v1/tasks/'+task+'/scores';
const board:Leaderboard={benchmark:'semeval-2022-task-8-multilingual-news-article-similarity',host:'MTEB',url:'https://leaderboard.mteb.org/tasks/'+task,feed,terms:'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',static:'paper',async fetch(){
 const d=await fetchJson<any>(feed); if(d.task.name!==task||d.task.mainScore!=='cosine_spearman'||d.subsets.length<10)throw Error('Unexpected STS22 task');
 const rows=d.rows.filter((r:any)=>Number.isFinite(r.score)&&r.model.name!=='mteb/baseline-random-encoder').map((r:any)=>({model:r.model.name,score:r.score,metrics:Object.fromEntries(d.subsets.map((s:string)=>[s,r.subsetScores?.[s]?.test])),open:r.model.openWeights??undefined,license:r.model.license||undefined,params:r.model.totalParamsB||undefined,link:r.model.url||undefined}));
 if(rows.some((r:any)=>Object.values(r.metrics).some((v:any)=>typeof v!=='number')))throw Error('Missing STS22 subset'); return checked(rows,10);
}}; export default board;
