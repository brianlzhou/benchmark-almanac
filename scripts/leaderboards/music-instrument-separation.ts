// MUSIC tests separation of musical instruments from mixtures. Table 1 reports the improvement
// in signal-to-distortion ratio over the mixture, in decibels, plus interference and artifact ratios.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://openaccess.thecvf.com/content_ECCV_2018/papers/Hang_Zhao_The_Sound_of_ECCV_2018_paper.pdf';
const board: Leaderboard = {
  benchmark: 'music-instrument-separation', url: feed, feed, static: 'paper',
  terms: 'CVF provides the ECCV paper at https://openaccess.thecvf.com/content_ECCV_2018/html/Hang_Zhao_The_Sound_of_ECCV_2018_paper.html.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/NMF DeepConvSep Spectral\s+Ratio Mask\s+Binary Mask([\s\S]*?)Table 1\. Model performances/)?.[1];
    if (!table || !/Linear scale\s+Log scale\s+Linear scale\s+Log scale/.test(table)) throw new Error('Missing Table 1');
    const vectors = ['NSDR','SIR','SAR'].map(label => {
      const line = table.split('\n').find(line => line.trim().startsWith(label + ' '));
      const values = line?.trim().split(/\s+/).slice(1).map(Number);
      if (values?.length !== 7 || !values.every(Number.isFinite)) throw new Error('Invalid ' + label + ' row');
      return values;
    });
    const configs = [
      ['NMF'], ['DeepConvSep'], ['Spectral Regression'], ['Ratio Mask', 'Linear scale'], ['Ratio Mask', 'Log scale'],
      ['Binary Mask', 'Linear scale'], ['Binary Mask', 'Log scale'],
    ];
    return checked(configs.map(([model, setting], i) => ({
      model, setting, score: vectors[0][i], metrics: {sir: vectors[1][i], sar: vectors[2][i]},
    })), 7);
  },
};
export default board;
