// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CLIPSep tests sound separation on two mixtures. Table 3 reports mean and median
// signal-to-distortion ratios in decibels, with a standard error for each mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2212.07065';
const board: Leaderboard = {
  benchmark: 'clipsep-sound-separation', feed, url: feed, static: 'paper',
  headline: 'The paper reports no overall score, so this is the plain mean of mean SDR in decibels on its two mixture tests.',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2212.07065.',
  parts: {music: {name: 'MUSIC+', note: 'Mean SDR in decibels.'}, vgg: {name: 'VGGSound-Clean+', note: 'Mean SDR in decibels.'}},
  stats: {
    musicMedian: { name: 'MUSIC+ median SDR', unit: 'score', better: 'higher', note: 'Median signal-to-distortion ratio in decibels.' },
    vggMedian: { name: 'VGGSound-Clean+ median SDR', unit: 'score', better: 'higher', note: 'Median signal-to-distortion ratio in decibels.' },
  },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[3] === 'MUSIC +' && t[0][5] === 'VGGSound-Clean +');
    if (!t || t[1][3] !== 'Mean SDR' || t[1][5] !== 'Mean SDR') throw new Error('Missing mixture SDR columns');
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const c of t.slice(3)) {
      if (c[0].endsWith(' models')) { setting = c[0].replace(' models', ''); continue; }
      if (c[0] === 'Mixture' || c[3] === '-' || c[5] === '-') continue;
      const [music, musicSe] = c[3].split(' \\pm ').map(numberCell);
      const [vgg, vggSe] = c[5].split(' \\pm ').map(numberCell);
      if (musicSe === undefined || vggSe === undefined) throw new Error('Missing standard error');
      rows.push({model: c[0].split(' (')[0], setting, score: (music+vgg)/2,
        metrics: {music, musicSe, musicMedian: numberCell(c[4]), vgg, vggSe, vggMedian: numberCell(c[6])}});
    }
    return checked(rows, 9);
  },
};
export default board;
