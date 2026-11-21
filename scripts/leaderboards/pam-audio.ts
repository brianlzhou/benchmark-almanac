// The source reports no overall score. The headline is the plain mean of the 10 parts, computed by this importer.
// Figure 5 reports absolute Pearson correlations with human ratings of overall quality and caption relevance.
// The five audio sources are test subsets. PAM and CNN14 are the evaluators.
// We transcribed the two panels twice and compared every label. The PDF hash guards both panels.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://arxiv.org/pdf/2402.00282v1';
const sources = ['AudioLDM','AudioLDM2','MelDiffusion','AudioGen m','AudioCaps'];
const labels = ['OVL','REL'].flatMap(m => sources.map(s => s + ' ' + m));
const keys = labels.map(l => l.replaceAll(' ', ''));
const board: Leaderboard = {
  benchmark: 'pam-audio', static: 'paper', feed, url: 'https://arxiv.org/abs/2402.00282v1',
  terms: 'The chart is attributed to the paper authors under the arXiv distribution terms. https://arxiv.org/licenses/',
  headline: 'The paper reports no overall correlation, so this is the plain mean of ten absolute correlations across five audio sources and two human rating dimensions.',
  parts: Object.fromEntries(keys.map((k,i) => [k, labels[i]])),
  async fetch() {
    const configs = [
      { model: 'CNN14', setting: 'KL soft', values: [0.14,0.23,0.32,0.22,0.14,0.34,0.24,0.39,0.27,0.11] },
      { model: 'CNN14', setting: 'KL sig', values: [0.17,0.21,0.36,0.26,0.10,0.32,0.26,0.40,0.30,0.01] },
      { model: 'PAM', values: [0.59,0.61,0.59,0.50,0.54,0.42,0.51,0.52,0.33,0.37] },
    ];
    const rows = configs.map(({values, ...config}) => ({ ...config, score: values.reduce((a,b) => a+b,0)/10,
      metrics: Object.fromEntries(keys.map((k,i) => [k,values[i]])) }));
    return checked(await chartRows(feed, 'e2f500a3f3fca9bf16eb0d0d2d3307e99d0d247433f23d997d8a80c9b62c9a43', rows), 3);
  },
};
export default board;
