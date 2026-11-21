// CodeSearchNet measures code retrieval from natural-language queries. MTEB reports test nDCG at 10 for six languages.
// The headline uses the leaderboard's overall score on its original zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'CodeSearchNetRetrieval';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/'+task+'/scores';
const parts = {go:'Go',java:'Java',javascript:'JavaScript',php:'PHP',python:'Python',ruby:'Ruby'};
type Entry = { model: {name:string, url?:string, openWeights?:boolean, totalParamsB?:number, license?:string},
  score:number, subsetScores: Record<string,{test:number}> };
const board: Leaderboard = {
  benchmark: 'codesearchnet-challenge', url: 'https://mteb-leaderboard.hf.space/tasks/'+task, feed, host:'MTEB', parts,
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const data = await fetchJson<{task:{name:string,mainScore:string},rows:Entry[],subsets:string[]}>(feed);
    const keys = Object.keys(parts);
    if (data.task.name !== task || data.task.mainScore !== 'ndcg_at_10' || data.subsets.slice().sort().join() !== keys.sort().join()) throw new Error('Changed CodeSearchNet task');
    const rows = data.rows.filter(r => keys.every(k => Number.isFinite(r.subsetScores[k]?.test))).map(({model,score,subsetScores}) => ({
      model:model.name, score, metrics:Object.fromEntries(keys.map(k => [k,subsetScores[k].test])), open:model.openWeights ?? undefined,
      params:model.totalParamsB || undefined, link:model.url || undefined, license:model.license || undefined,
    }));
    return checked(rows,205);
  },
};
export default board;
