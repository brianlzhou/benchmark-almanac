// FGVC-Aircraft tests classification of aircraft variants from images.
// MTEB publishes test accuracy for image classification and zero-shot classification on separate task boards.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const endpoint = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/';
type Result = {model:{name:string,url:string,openWeights:boolean,license:string,totalParamsB:number},
  score:number, subsetScores:{default:{test:number}}};
const board: Leaderboard = {
  benchmark:'fgvc-aircraft', url:'https://mteb-leaderboard.hf.space/tasks/FGVCAircraft', host:'MTEB',
  feed:endpoint+'FGVCAircraft/scores', terms:'MTEB releases results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const task of ['FGVCAircraft','FGVCAircraftZeroShot']) {
      const zero = task.endsWith('ZeroShot');
      if (zero) await new Promise(resolve=>setTimeout(resolve,1050));
      const b = await fetchJson<{task:{name:string,mainScore:string},rows:Result[]}>(endpoint+task+'/scores');
      if (b.task.name !== task || b.task.mainScore !== 'accuracy' || b.rows.length < (zero ? 52 : 50))
        throw new Error('Missing MTEB aircraft accuracy results for '+task);
      for (const {model,score,subsetScores} of b.rows) {
        if (score !== subsetScores.default?.test || !Number.isFinite(score) || score < 0 || score > 1)
          throw new Error('Invalid aircraft test accuracy');
        rows.push({model:model.name, setting:zero?'Zero-shot classification':'Image classification',
          score:score*100, params:model.totalParamsB > 0 ? model.totalParamsB : undefined,
          open:model.openWeights, license:model.license, link:model.url});
      }
    }
    return checked(rows,102);
  },
};
export default board;
