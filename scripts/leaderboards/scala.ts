// ScaLA tests linguistic acceptability in Danish, Norwegian and Swedish.
// MTEB reports test accuracy across the four Scandinavian language subsets.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const task='ScalaClassification';
const feed='https://mteb-leaderboard-backend.hf.space/v1/tasks/'+task+'/scores';
const board:Leaderboard={benchmark:'scala',host:'MTEB',url:'https://leaderboard.mteb.org/tasks/'+task,feed,terms:'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',static:'paper',parts:{Danish:'Danish',Norwegian_b:'Norwegian Bokmål',Norwegian_n:'Norwegian Nynorsk',Swedish:'Swedish'},async fetch(){
 const d=await fetchJson<any>(feed); if(d.task.name!==task||d.task.mainScore!=='accuracy'||d.subsets.length!==4)throw Error('Unexpected ScaLA task');
 const rows=d.rows.filter((r:any)=>Number.isFinite(r.score)&&r.model.name!=='mteb/baseline-random-encoder').map((r:any)=>{const metrics=Object.fromEntries(d.subsets.map((s:string)=>[s,r.subsetScores?.[s]?.test]));if(Object.values(metrics).some(v=>typeof v!=='number'))throw Error('Missing ScaLA subset');return {model:r.model.name,score:r.score*100,metrics,open:r.model.openWeights??undefined,license:r.model.license||undefined,params:r.model.totalParamsB||undefined,link:r.model.url||undefined};}); return checked(rows,10);
}}; export default board;
