// VSEC evaluates Vietnamese spelling error detection and correction across 9,341 annotated sentences.
// This importer reads Table 4 (Table 12 in HTML order) of arXiv:2111.00640, using Correction F1 (CF)
// as the headline score with Detection precision, recall, F1 and Correction precision and recall as stats.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2111.00640';

const board: Leaderboard = {
  benchmark: 'vsec',
  static: 'paper',
  url: 'https://arxiv.org/abs/2111.00640',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is Correction F1 (CF) on a 0 to 1 scale from Table 4.',
  stats: {
    detectionPrecision: { name: 'Detection precision', unit: 'score', better: 'higher' },
    detectionRecall: { name: 'Detection recall', unit: 'score', better: 'higher' },
    detectionF1: { name: 'Detection F1', unit: 'score', better: 'higher' },
    correctionPrecision: { name: 'Correction precision', unit: 'score', better: 'higher' },
    correctionRecall: { name: 'Correction recall', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find((g) => g[0]?.[0] === 'Method' && g[1]?.join('|') === 'Method|DP|DR|DF|CP|CR|CF');
    if (!t) throw new Error('VSEC Table 4 missing');

    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const model = r[0]?.trim() ?? '';
      if (!model) continue;
      rows.push({
        model,
        score: numberCell(r[6] ?? ''),
        metrics: {
          detectionPrecision: numberCell(r[1] ?? ''),
          detectionRecall: numberCell(r[2] ?? ''),
          detectionF1: numberCell(r[3] ?? ''),
          correctionPrecision: numberCell(r[4] ?? ''),
          correctionRecall: numberCell(r[5] ?? ''),
        },
      });
    }

    return checked(rows, 5);
  },
};

export default board;
