// MASD evaluates style classification on Lakh MIDI files. Table 6 ranks pattern configurations by ROC AUC.
// The authors train logistic regression with features from SIA or P2 and five-fold cross-validation.
// Parenthesized values accompany the three measures without an identified uncertainty statistic.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/1910.09242';
function metric(cell: string) {
  const match = cell.match(/^(\d[\d.]*)\s*\(\s*(\d[\d.]*)\s*\)$/);
  if (!match) throw new Error('Missing classification measure: ' + cell);
  return [Number(match[1]), Number(match[2])];
}
const board: Leaderboard = {
  benchmark: 'lakh-midi-masd-style', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  stats:{f1Measure:{name:'F1 measure',unit:'score',better:'higher',note:'Stored from 0 to 1.'},accuracy:{name:'Accuracy',unit:'score',better:'higher',note:'Stored from 0 to 1.'},patterns:{name:'Patterns',unit:'count'},folds:{name:'Cross-validation folds',unit:'count'}},
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.[4] === 'MASD' && t[0][6] === 'MASD');
    if (table?.[1].slice(4).join('|') !== 'AUC ROC|F1 measure|Accuracy|#patterns') throw new Error('Missing MASD columns');
    return checked(table.slice(2).map(([setting, , , , auc, f1, acc, count]) => {
      if (!/^(?:Sia|P2)-\d+$/.test(setting) || !/^\d+$/.test(count)) throw new Error('Invalid pattern configuration');
      const [score, aucSpread] = metric(auc), [f1Measure, f1Spread] = metric(f1), [accuracy, accuracySpread] = metric(acc);
      return { model: setting.split('-')[0], setting, score,
        metrics: { aucSpread, f1Measure, f1Spread, accuracy, accuracySpread, patterns: Number(count), folds: 5 } };
    }), 10);
  },
};
export default board;
