// MIMIC-CXR tests radiology report generation from chest X-rays. The all-views test leaderboard reports RadGraph F1 in percent.
// Preserve the published test size in each setting because the evaluated cohorts differ.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://www.sota2.com/research/sota/medical-report-generation-on-mimic-cxr-all-views-test';
const measures = ['BLEU-4', 'CheXbert mF1-14', 'CheXbert mF1-5', 'CheXbert eF1-14', 'Rad-Graph F1', 'BLEU-1', 'ROUGE-L'];
const board: Leaderboard = {
  benchmark: 'mimic-cxr-report-generation', url: feed, feed, host: 'SOTA2 Research',
  headline: 'The all-views leaderboard reports RadGraph F1 for the test cohort named in each setting.',
  terms: 'SOTA2 publishes the table and its paper links at https://www.sota2.com/research/sota/medical-report-generation-on-mimic-cxr-all-views-test.',
  stats: {
    'BLEU-4': { name: 'BLEU-4', unit: '%', better: 'higher' },
    'CheXbert mF1-14': { name: 'CheXbert micro F1 (14 labels)', unit: '%', better: 'higher' },
    'CheXbert mF1-5': { name: 'CheXbert micro F1 (5 labels)', unit: '%', better: 'higher' },
    'CheXbert eF1-14': { name: 'CheXbert example F1 (14 labels)', unit: '%', better: 'higher' },
    'Rad-Graph F1': { name: 'RadGraph F1', unit: '%', better: 'higher' },
    'BLEU-1': { name: 'BLEU-1', unit: '%', better: 'higher' },
    'ROUGE-L': { name: 'ROUGE-L', unit: '%', better: 'higher' },
  },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === ['Method', 'Links', ...measures].join('|'));
    if (!t) throw new Error('Missing MIMIC-CXR all-views metrics');
    const rows: LeaderboardRow[] = [];
    for (const [method, , ...cells] of t.slice(1)) {
      if (cells[4]?.text === '—') continue;
      const title = method.html.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const size = method.html.match(/aria-label="Inference config: Test set size=([\d,]+\d)/);
      if (!title || !size || cells.length !== measures.length) throw new Error('Missing named model, test cohort or scores');
      const metrics: Record<string, number> = {};
      cells.forEach((c, i) => { if (c.text !== '—') metrics[measures[i]] = numberCell(c.text); });
      rows.push({ model: text(title[2]), score: metrics['Rad-Graph F1'], metrics,
        setting: 'All views, test set size ' + size[1], link: new URL(title[1], feed).href });
    }
    return checked(rows, 2);
  },
};
export default board;
