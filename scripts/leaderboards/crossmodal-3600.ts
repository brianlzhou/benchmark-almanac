// Crossmodal-3600 tests retrieval of images from multilingual descriptions. The MTEB
// leaderboard gives nDCG@10 on the 0 to 1 scale across 36 languages and for each language.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const task = 'XM3600T2IRetrieval';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
type Row = {model: {name: string, url: string, totalParamsB: number, openWeights: boolean, license: string},
  score: number, subsetScores: Record<string,{test: number}>};
const board: Leaderboard = {
  benchmark: 'crossmodal-3600', feed, url: 'https://mteb-leaderboard.hf.space/tasks/' + task, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const b = await fetchJson<{task:{name: string, mainScore: string}, subsets: string[], rows: Row[]}>(feed);
    if (b.task.name !== task || b.task.mainScore !== 'ndcg_at_10' || b.subsets.length !== 36) throw new Error('Unexpected XM3600 task');
    const names = new Intl.DisplayNames(['en'], {type: 'language'});
    board.parts = Object.fromEntries(b.subsets.map(lang => [lang, {name: names.of(lang) ?? lang, group: 'Language'}]));
    return checked(b.rows.map(({model, score, subsetScores}) => {
      const metrics = Object.fromEntries(b.subsets.map(lang => [lang, subsetScores[lang]?.test]));
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing XM3600 test language');
      return {model: model.name, score, metrics, setting: 'Text-to-image retrieval', link: model.url,
        open: model.openWeights, license: model.license, params: model.totalParamsB > 0 ? model.totalParamsB : undefined};
    }), 52);
  },
};
export default board;
