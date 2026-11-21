// LightGenBench tests where a 3D asset should emit light and what color it should emit.
// Table 2 reports emission-mask intersection over union across five sampling seeds.
// Table 3 gives human preferences. Tables S3 and S4 break down mask quality and emission color errors.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.39038';
const board: Leaderboard = {
  benchmark: 'lightgenbench', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  stats:{mae:{name:'Mean absolute error',unit:'score',better:'lower'},psnr:{name:'Peak signal-to-noise ratio',unit:'score',better:'higher'},precision:{name:'Precision',unit:'score',better:'higher',note:'Rate from 0 to 1.'},recall:{name:'Recall',unit:'score',better:'higher',note:'Rate from 0 to 1.'},f1:{name:'F1',unit:'score',better:'higher',note:'Rate from 0 to 1.'},maskMae:{name:'Mask mean absolute error',unit:'score',better:'lower'},maskPsnr:{name:'Mask peak signal-to-noise ratio',unit:'score',better:'higher'},meanRank:{name:'Mean rank',unit:'count',better:'lower'},firstPlacePct:{name:'First-place rate',unit:'%',better:'higher'}},
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[0][1]?.startsWith('IoU') && t[0][2]?.startsWith('MAE') && t[0][3]?.startsWith('PSNR'));
    const user = tables.find(t => t[0][1]?.startsWith('Mean rank') && t[0][2]?.startsWith('Top-1 rate'));
    const mask = tables.find(t => t[0][2]?.startsWith('Prec.') && t[0][4]?.startsWith('F1'));
    const error = tables.find(t => t[0].join('|') === '|Mask|Mask|All|All' && t[1][1]?.startsWith('MAE') && t[1][2]?.startsWith('PSNR'));
    if (!main || !user || !mask || !error) throw new Error('Missing LightGenBench results');
    return checked(main.slice(1).map(([model, iou, mae, psnr]) => {
      const u = user.find(r => r[0] === model), m = mask.find(r => r[0] === model), e = error.find(r => r[0] === model);
      if (!u || !m || !e || m[1] !== iou) throw new Error('Incomplete results for ' + model);
      const [meanRank, rankSpread] = u[1].split('\\pm').map(v => numberCell(v));
      if (!Number.isFinite(rankSpread)) throw new Error('Missing rank spread');
      return { model, score: numberCell(iou), trials: 5, metrics: { mae: numberCell(mae), psnr: numberCell(psnr),
        precision: numberCell(m[2]), recall: numberCell(m[3]), f1: numberCell(m[4]),
        maskMae: numberCell(e[1]), maskPsnr: numberCell(e[2]), meanRank, rankSpread,
        firstPlacePct: numberCell(u[2].replace(/%$/, '')) } };
    }), 4);
  },
};
export default board;
