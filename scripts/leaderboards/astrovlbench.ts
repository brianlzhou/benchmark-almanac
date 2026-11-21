// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// AstroVLBench tests astronomical image interpretation. Tables S1 through S5 give the eight classification accuracies.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2604.24589';
const columns = [
  [['Accuracy', 'host']],
  [['MiraBest_F', 'first'], ['MiraBest_N', 'nvss']],
  [['Overall', 'sed']],
  [['Accuracy', 'lightCurve']],
  [['Q1', 'q1'], ['Q2', 'q2'], ['Q3', 'q3']],
] as const;

const board: Leaderboard = {
  benchmark: 'astrovlbench', static: 'paper', url: feed, feed,
  terms: 'The dataset uses CC BY 4.0. https://huggingface.co/datasets/XiaomanZhang/AstroVLBench',
  headline: 'The paper reports no overall accuracy, so this is the plain mean of eight accuracies across five observing tasks.',
  aliases: { 'Qwen3-235B': 'qwen3-235b-a22b' },
  parts: {host:'QSO host galaxy classification', first:'Radio morphology: FIRST', nvss:'Radio morphology: NVSS',
    sed:'SED classification', lightCurve:'Light curve classification', q1:'Spectral interpretation: Q1',
    q2:'Spectral interpretation: Q2', q3:'Spectral interpretation: Q3'},
  async fetch() {
    const html = await paperHtml(feed);
    const models = new Map<string, Record<string, number>>();
    for (const [i, fields] of columns.entries()) {
      const figure = html.split('<figure id="A1.T' + (i + 1) + '"')[1]?.split('</figure>')[0];
      const table = figure && paperTables(figure)[0];
      if (!table) throw new Error('Missing Table S' + (i + 1));
      const [header, ...rows] = grid(table);
      for (const [label, key] of fields) {
        const col = header.indexOf(label);
        if (col < 1 || header[col+1] !== '95% CI') throw new Error('Missing accuracy or interval for ' + label);
        for (const row of rows) {
          const metrics = models.get(row[0]) ?? {};
          const ci = /^\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]$/.exec(row[col+1]);
          if (!ci || !row[col] || !Number.isFinite(Number(row[col]))) throw new Error('Invalid accuracy in ' + label);
          metrics[key] = 100 * Number(row[col]);
          metrics[key+'Low'] = 100 * Number(ci[1]);
          metrics[key+'High'] = 100 * Number(ci[2]);
          models.set(row[0], metrics);
        }
      }
    }
    const keys = columns.flat().map(([, key]) => key);
    const rows = Array.from(models).filter(([,m]) => keys.every(k => Number.isFinite(m[k])));
    return checked(rows.map(([model, metrics]) => ({model, metrics, score: keys.reduce((sum,k) => sum+metrics[k],0)/keys.length})), 6);
  },
};
export default board;
