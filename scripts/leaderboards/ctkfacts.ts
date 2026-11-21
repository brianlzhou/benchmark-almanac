// CTKFacts tests Czech fact verification. MTEB publishes average precision on its paired-text NLI task.
// Use test-set max AP in the source's 0 to 1 units and retain validation AP when available.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/CTKFactsNLI/scores';
type Row = {model:{name:string;url?:string;license?:string;openWeights?:boolean;totalParamsB?:number};
  subsetScores:{default:{test:number;validation?:number}}};
export default {
  benchmark:'ctkfacts',url:'https://leaderboard.mteb.org/tasks/CTKFactsNLI',feed,host:'MTEB',
  terms:'MTEB results are CC0 1.0, https://huggingface.co/datasets/mteb/results',
  parts:{validation:'Validation average precision'},
  async fetch() {
    const data = await fetchJson<{task:{name:string;mainScore:string};rows:Row[]}>(feed);
    if (data.task.name !== 'CTKFactsNLI' || data.task.mainScore !== 'max_ap') throw new Error('Unexpected CTKFacts metric');
    const rows = data.rows.filter(r => r.model.name !== 'mteb/baseline-random-encoder').map(({model,subsetScores}) => {
      const {test,validation} = subsetScores.default;
      if (!Number.isFinite(test) || (validation !== undefined && !Number.isFinite(validation))) throw new Error('Invalid AP for '+model.name);
      return {model:model.name,score:test,metrics:validation === undefined ? undefined : {validation},link:model.url,
        open:model.openWeights,license:model.license || undefined,params:model.totalParamsB || undefined};
    });
    return checked(rows,192);
  },
} satisfies Leaderboard;
