// DiaBLa contains parallel English and French dialogue. The MTEB leaderboard reports
// F1 for bilingual sentence matching. Keep models with test results in both directions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const task = 'DiaBlaBitextMining';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
type Row = {model:{name:string,url:string,openWeights:boolean,license:string,totalParamsB:number},
  score:number, subsetScores:Record<string,{test:number}>};
const board: Leaderboard = {
  benchmark:'diabla', feed, url:'https://mteb-leaderboard.hf.space/tasks/' + task, host:'MTEB',
  terms:'The MTEB results dataset uses CC0 1.0. https://huggingface.co/datasets/mteb/results',
  parts:{enFr:'English to French',frEn:'French to English'},
  async fetch() {
    const b = await fetchJson<{task:{name:string,mainScore:string},subsets:string[],rows:Row[]}>(feed);
    if (b.task.name !== task || b.task.mainScore !== 'f1' || b.subsets.slice().sort().join('|') !== 'en-fr|fr-en') throw new Error('Missing bilingual F1 scores');
    return checked(b.rows.filter(r=>['en-fr','fr-en'].every(k=>Number.isFinite(r.subsetScores[k]?.test))).map(r=>({
      model:r.model.name, score:r.score, link:r.model.url, open:r.model.openWeights, license:r.model.license,
      params:r.model.totalParamsB > 0 ? r.model.totalParamsB : undefined, setting:'Bitext mining',
      metrics:{enFr:r.subsetScores['en-fr'].test,frEn:r.subsetScores['fr-en'].test},
    })),194);
  },
};
export default board;
