// SingMOS evaluates singing-quality predictions against listener ratings.
// Table 2 lists utterance-level mean squared error first on the 645-clip main test.
// Table 3 reports the same metrics on a separate test set of 232 clips.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2406.10911';
const keys = ['utteranceMse', 'utteranceLcc', 'utteranceSrcc', 'utteranceKtrcc',
  'systemMse', 'systemLcc', 'systemSrcc', 'systemKtrcc'];
const labels = ['Utterance MSE', 'Utterance LCC', 'Utterance SRCC', 'Utterance KTRCC',
  'System MSE', 'System LCC', 'System SRCC', 'System KTRCC'];
export default {
  benchmark: 'singmos', url, feed: url, static: 'paper',
  terms: 'The authors publish Tables 2 and 3 on arXiv. https://arxiv.org/abs/2406.10911',
  headline: 'The headline is utterance-level mean squared error on the main test. Lower values indicate more accurate predictions.',
  parts: Object.fromEntries(['', 'other'].flatMap(prefix => keys.map((key, i) => ({
    key: prefix + key, name: (prefix ? 'Test-other1: ' : 'Test-main: ') + labels[i],
    unit: 'score' as const, better: key.endsWith('Mse') ? 'lower' as const : 'higher' as const,
  })).map(({ key, ...part }) => [key, part]))),
  async fetch() {
    const html = await paperHtml(url);
    const tables = ['S3.T2', 'S3.T3'].map(id => {
      const start = html.indexOf('<figure id="' + id + '"');
      if (start < 0) throw new Error('Missing SingMOS table: ' + id);
      const t = grid(paperTables(html.slice(start, html.indexOf('</figure>', start)))[0]);
      if (t[0][0] !== 'SSL Model' || t[0][5] !== 'System' || t[1][1] !== 'Test Error\\downarrow')
        throw new Error('Unexpected SingMOS table columns');
      return t.slice(2);
    });
    const rows = tables[0].map(c => {
      const other = tables[1].find(r => r[0] === c[0]);
      if (!other) throw new Error('Missing test-other1 row for ' + c[0]);
      const metrics: Record<string, number> = {};
      keys.forEach((key, i) => {
        metrics[key] = numberCell(c[i + 1]);
        metrics['other' + key] = numberCell(other[i + 1]);
      });
      return { model: c[0].replace(/\*$/, ''), setting: c[0].endsWith('*') ? 'Large backbone' : 'Base backbone',
        score: metrics.utteranceMse, metrics };
    });
    return checked(rows, 5);
  },
} satisfies Leaderboard;
