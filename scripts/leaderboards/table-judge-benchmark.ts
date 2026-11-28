// Table Judge Benchmark measures how often language-model judges detect injected table OCR errors without rejecting
// clean pairs. The benchmark authors publish a fixed analysis README with eight model rows. This importer reads the
// overall FPR, TPR, injected-rubric detection and F1 table, using F1 as the board's headline percentage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/reductoai/table-judge-benchmark/main/results/benchmark/analysis/README.md';
const board: Leaderboard = {
  benchmark: 'table-judge-benchmark',
  stats: { falsePositiveRate: { name: 'False positive rate', unit: '%', better: 'lower' }, injectedRubricDetection: { name: 'Injected rubric detection', unit: '%', better: 'higher' }, successfulResponses: { name: 'Successful responses', unit: 'count' }, truePositiveRate: { name: 'True positive rate', unit: '%', better: 'higher' } },
  url: 'https://github.com/reductoai/table-judge-benchmark',
  feed: FEED,
  terms: 'The public repository includes its project license and publishes the analysis tables. https://github.com/reductoai/table-judge-benchmark',
  static: 'paper',
  headline: 'The benchmark table ranks judges by F1, the harmonic mean of precision and true positive rate.',
  async fetch() {
    const markdown = await fetchText(FEED);
    const section = markdown.match(/\| Model\s+\| Success[\s\S]*?(?=\n\n|\n##)/)?.[0];
    if (!section) throw new Error('Table Judge Benchmark: overall metrics table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
      if (!m || /^Model|^-/.test(m[1].trim())) continue;
      const pct = (s: string) => Number(s.replace(/[*%]/g, '').trim());
      const success = m[2].replaceAll(',', '').trim().match(/(\d+)\/(\d+)/);
      const fpr = pct(m[3]);
      const tpr = pct(m[4]);
      const injected = pct(m[5]);
      const f1 = pct(m[6]);
      if (!success || [fpr, tpr, injected, f1].some((n) => !Number.isFinite(n))) throw new Error(`Table Judge Benchmark: invalid row ${m[1].trim()}`);
      rows.push({ model: m[1].trim(), score: f1, metrics: { falsePositiveRate: fpr, truePositiveRate: tpr, injectedRubricDetection: injected, successfulResponses: Number(success[1]) } });
    }
    if (rows.length !== 8) throw new Error(`Table Judge Benchmark: ${rows.length} rows, expected 8`);
    return rows;
  },
};
export default board;
