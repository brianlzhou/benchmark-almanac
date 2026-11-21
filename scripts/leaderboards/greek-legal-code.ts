// Greek Legal Code tests topic classification of Greek legislation by chapter.
// MTEB reports test and validation accuracy separately. The headline uses the test split.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const task = 'GreekLegalCodeClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/GreekLegalCodeClassification/scores';
type Result = {model:{name:string,url?:string,openWeights?:boolean,totalParamsB?:number,license?:string},subsetScores:{default:{test:number,validation?:number}}};
const board:Leaderboard = {
  benchmark:'greek-legal-code',host:'MTEB',url:'https://leaderboard.mteb.org/tasks/'+task,feed,
  terms:'MTEB releases the results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  parts:{validation:{name:'Validation accuracy',unit:'%'}},
  async fetch() {
    const data = await fetchJson<{task:{name:string,mainScore:string},rows:Result[]}>(feed);
    if (data.task.name !== task || data.task.mainScore !== 'accuracy') throw new Error('Missing Greek Legal Code accuracy');
    const pct = (x:number) => {
      if (!Number.isFinite(x) || x < 0 || x > 1) throw new Error('Invalid accuracy');
      return Number((100*x).toFixed(5));
    };
    return checked(data.rows.filter(r => r.model.name !== 'mteb/baseline-random-encoder').map(({model,subsetScores}) => {
      const {test,validation} = subsetScores.default;
      return {model:model.name,score:pct(test),metrics:validation == null ? undefined : {validation:pct(validation)},
        open:model.openWeights ?? undefined,license:model.license || undefined,params:model.totalParamsB || undefined,link:model.url || undefined};
    }),186);
  },
};
export default board;
