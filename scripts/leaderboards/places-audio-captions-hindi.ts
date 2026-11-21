// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 1 measures recall on Hindi speech and image retrieval among 1,000 pairs. R@1 is the first cutoff.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2211.01180';
const parts = { imageSpeech1: 'Image to speech R@1', imageSpeech5: 'Image to speech R@5', imageSpeech10: 'Image to speech R@10',
  speechImage1: 'Speech to image R@1', speechImage5: 'Speech to image R@5', speechImage10: 'Speech to image R@10' };

export default {
  benchmark: 'places-audio-captions-hindi', static: 'paper', url, feed: url, parts,
  headline: 'The paper reports no overall score, so the headline is the mean of recall at rank 1 across the two retrieval directions.',
  terms: 'The M-SpeechCLIP authors publish the retrieval scores on arXiv. https://arxiv.org/abs/2211.01180',
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0][1] === 'Image\\rightarrowSpeech' && t[0][4] === 'Speech\\rightarrowImage');
    if (!table || table[1].slice(1).join('/') !== 'R@1/R@5/R@10/R@1/R@5/R@10') throw new Error('Missing Table 1 retrieval cutoffs');
    const hindi = table.findIndex(r => r[1] === 'Hindi');
    const english = table.findIndex(r => r[1] === 'English');
    if (hindi < 0 || english <= hindi) throw new Error('Missing Hindi block');
    const rows = table.slice(hindi + 1, english).filter(r => r[0] !== '.').map(([label, ...cells]) => {
      if (cells.length !== 6 || cells.some(s => !/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid recalls for ' + label);
      const values = cells.map(Number);
      const variant = /Batches|^(Mono|Multi)\+/.test(label);
      const model = variant ? 'M-SpeechCLIP' : label.replace('\\rightarrow', ' to ');
      return { model, ...(variant ? { setting: label } : {}), score: (values[0] + values[3]) / 2,
        metrics: Object.fromEntries(Object.keys(parts).map((k, i) => [k, values[i]])) };
    });
    return checked(rows, 12);
  },
} satisfies Leaderboard;
