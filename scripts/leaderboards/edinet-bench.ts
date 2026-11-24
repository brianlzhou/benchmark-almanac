// EDINET-Bench tests financial reasoning on Japanese annual reports.
// Table 6 reports ROC-AUC and MCC for two tasks and accuracy for industry prediction.
// Per Table 6 ("For LLMs, the scores represent the mean ± standard deviation over three runs"), keep the
// headline standard deviation in metrics.std and drop per-part standard deviations.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.08762';
const names = ['Fraud Detection ROC-AUC', 'Fraud Detection MCC', 'Earnings Forecasting ROC-AUC',
  'Earnings Forecasting MCC', 'Industry Prediction Accuracy'];
const board: Leaderboard = {
  benchmark: 'edinet-bench', url: 'https://sakana.ai/edinet-bench/', feed, static: 'paper',
  terms: 'The authors publish Table 6 under the terms at https://arxiv.org/abs/2506.08762.',
  headline: 'The paper gives no overall score, so the headline is its first metric, accounting fraud detection ROC-AUC.',
  parts: Object.fromEntries(names.map(k => [k,k])),
  aliases: {'GPT-4o (snapshot unspecified)': 'gpt-4o-nov-2024',
    'Claude 3.5 Sonnet (snapshot unspecified)': 'claude-3-5-sonnet-october-2024'},
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[2] === 'Fraud Detection');
    if (!t || t[0].slice(2).join('|') !== 'Fraud Detection|Fraud Detection|Earnings Forecasting|Earnings Forecasting|Industry Prediction' ||
      t[1].map(s => s.split(' ')[0]).join('|') !== 'Model|Input|ROC-AUC|MCC|ROC-AUC|MCC|Accuracy')
      throw new Error('EDINET-Bench Table 6 columns changed');
    const rows = t.slice(2).filter(r => r[0] !== r[1]).map(([label, setting, ...cells]) => {
      const metrics: Record<string, number> = {};
      for (const [i, cell] of cells.entries()) {
        if (i === 4 && cell === '–') continue;
        const match = cell.match(/^(-?[\d.]+)(?: \\pm ([\d.]+))?$/);
        if (!match) throw new Error('Invalid EDINET-Bench result: ' + cell);
        metrics[names[i]] = Number(match[1]);
        if (match[2] && i === 0) metrics.std = Number(match[2]);
      }
      return {model: label.replace(/ †$/, ''), setting, score: metrics[names[0]], metrics,
        ...(metrics.std !== undefined ? {trials: 3} : {})};
    });
    return checked(rows, 42);
  },
};
export default board;
