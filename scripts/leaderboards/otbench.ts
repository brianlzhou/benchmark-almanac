// The source reports no overall score. The headline is the plain mean of the 19 parts, computed by this importer.
// Figure 7 prints the percentage of compatible fixed specialists each generalist beats on each capability.
// The authors average paired datasets, give half credit for ties and average twelve imputation settings.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2611.13001';
const axes = Object.entries({
  Generation: ['Fidelity', 'C2ST', 'Alpha-precision', 'Association', 'TSTR gap', 'Global utility'],
  Imputation: ['Numerical point', 'Categorical point', 'Categorical distribution', 'Numerical distribution', 'Association', 'Utility gap'],
  Prediction: ['Hard decision', 'Proper scores', 'Ranking/selective', 'Calibration', 'Squared error', 'Mean absolute', 'Median absolute'],
}).flatMap(([group,names]) => names.map(name => ({group, name, key: group+': '+name})));
const board: Leaderboard = {
  benchmark: 'otbench', static: 'paper', url: feed+'#page=11', feed,
  terms: 'The authors publish Figure 7 under the paper terms at https://arxiv.org/abs/2611.13001.',
  headline: 'The paper reports the axes separately. The headline is the plain mean percentage of fixed specialists beaten across its 19 capability axes.',
  parts: Object.fromEntries(axes.map(({key,group,name}) => [key,{group,name,unit:'%'}])),
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Figure 7: A generalist');
    const start = pdf.lastIndexOf('(a) Generation', end);
    if (start < 0 || !/\(b\) Imputation\s+\(c\) Prediction/.test(pdf.slice(start,start+220))) throw new Error('Missing OTBench Figure 7 panels');
    const body = pdf.slice(start,end).replace(/(Forest-VP Joint)\s+Fraction beaten\s+/, '$1 ');
    const rows = body.split('\n').filter(line => line.includes('%')).map(line => {
      const match = /^\s*(\S.*?)\s+((?:\d+%\s*){19})(?:0\.\d+)?\s*$/.exec(line);
      if (!match) throw new Error('Invalid OTBench capability row: '+line);
      const values = [...match[2].matchAll(/(\d+)%/g)].map(m => Number(m[1]));
      return { model: match[1].trim(), score: values.reduce((a,b) => a+b,0)/axes.length,
        metrics: Object.fromEntries(axes.map(({key},i) => [key,values[i]])) };
    });
    return checked(rows,9);
  },
};
export default board;
