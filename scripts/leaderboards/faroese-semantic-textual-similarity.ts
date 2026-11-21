// FaroeseSTS tests its published MTEB task on named encoder models.
// MTEB reports the cosine_spearman headline from its public task feed.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://mteb-leaderboard-backend.hf.space/v1/tasks/FaroeseSTS/scores';
const board:Leaderboard={benchmark:'faroese-semantic-textual-similarity',url:'https://leaderboard.mteb.org/tasks/FaroeseSTS',feed:FEED,host:'MTEB',terms:'MTEB publishes model results under CC0 1.0. https://huggingface.co/datasets/mteb/results',static:'paper',parts:{sourceSplit:{name:'Source split',unit:'score',better:'higher'}},async fetch(){
 const d=await fetchJson<any>(FEED); if(d.task.name!=='FaroeseSTS'||d.task.mainScore!=='cosine_spearman'||d.rows.length<194)throw Error('Unexpected MTEB task'); const rows=d.rows.filter((r:any)=>Number.isFinite(r.score)&&r.model.name!=='mteb/baseline-random-encoder').map((r:any)=>{const sub=r.subsetScores?.default||{};const metricValue=Object.values(sub).find((v:any)=>typeof v==='number') as number|undefined;return {model:r.model.name,score:r.score,metrics:metricValue===undefined?undefined:{sourceSplit:metricValue},open:r.model.openWeights??undefined,license:r.model.license||undefined,params:r.model.totalParamsB||undefined,link:r.model.url||undefined};}); return checked(rows,10);
}}; export default board;
