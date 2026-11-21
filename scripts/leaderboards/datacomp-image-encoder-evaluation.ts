// DataComp measures transfer across 37 tasks after training CLIP on each submitted dataset.
// The board publishes Average perf. and ImageNet accuracy in eight track and scale TSV files.
// The training README specifies which ViT architecture every participant must train at each scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.datacomp.ai/dcclip/leaderboard.html';
const models = { small: 'ViT-B/32', medium: 'ViT-B/32', large: 'ViT-B/16', xlarge: 'ViT-L/14' };
const board: Leaderboard = {
  benchmark: 'datacomp-image-encoder-evaluation', url, feed: url,
  terms: 'DataComp publishes the entries under the competition rules at https://www.datacomp.ai/dcclip/.',
  parts: { imageNet: 'ImageNet accuracy' },
  stats:{datasetSize:{name:'Dataset size',unit:'count',note:'Number of training images in the submitted dataset.'}},
  async fetch() {
    const page = await fetchText(url);
    if (!page.includes("fetch('data/' + track + '_' + scale + '.tsv')") ||
        !page.includes('Average <br> perf.') || !page.includes('ImageNet <br> acc.')) throw new Error('DataComp board changed');
    const rows: LeaderboardRow[] = [];
    for (const track of ['filter', 'byod']) {
      for (const [scale, model] of Object.entries(models)) {
        await new Promise(resolve => setTimeout(resolve, 1050));
        const tsv = await fetchText(new URL('data/' + track + '_' + scale + '.tsv', url).href);
        const lines = tsv.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) throw new Error('Empty DataComp track');
        for (const line of lines) {
          const cells = line.split('\t');
          const [created, submission, imageNet, overall, size, submitter, link] = cells;
          const date = /^(\d\d)-(\d\d)-(\d{4})$/.exec(created);
          if (cells.length !== 7 || !date || !submission || !submitter ||
              ![imageNet, overall].every(v => /^0?\.\d+$|^[01]$/.test(v))) throw new Error('Invalid DataComp entry: ' + submission);
          const metrics: Record<string, number> = { imageNet: Number(imageNet) * 100 };
          if (/^\d+$/.test(size)) metrics.datasetSize = Number(size);
          rows.push({ model, setting: [track === 'filter' ? 'Filtering' : 'BYOD', scale, submission].join(', '),
            date: [date[3], date[1], date[2]].join('-'), submitter, link: link || undefined, score: Number(overall) * 100, metrics });
        }
      }
    }
    return checked(rows, 84);
  },
};
export default board;
