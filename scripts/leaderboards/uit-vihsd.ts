// UIT-ViHSD evaluates three-class Vietnamese social media hate speech detection (clean, offensive,
// and hate). This importer reads Table 4 of the benchmark paper (arXiv:2103.11528), capturing
// macro F1 and accuracy in percent across six neural and multilingual transformer baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2103.11528';

const board: Leaderboard = {
  benchmark: 'uit-vihsd',
  static: 'paper',
  url: 'https://arxiv.org/abs/2103.11528',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is macro F1 in percent on the UIT-ViHSD test set from Table 4.',
  stats: {
    accuracy: { name: 'Accuracy', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find(
      (g) => g[0]?.[1] === 'Model' && /Accuracy/i.test(g[0]?.[3] ?? '') && /F1-macro/i.test(g[0]?.[4] ?? '')
    );
    if (!t) throw new Error('UIT-ViHSD Table 4 missing');

    const rows: LeaderboardRow[] = [];
    let currentModel = '';

    for (const r of t.slice(1)) {
      const m = r[1]?.trim();
      if (m) currentModel = m;
      const pre = r[2]?.trim() ?? '';
      if (!pre) continue;

      const label =
        /^(?:Text CNN|GRU)$/i.test(currentModel)
          ? `${currentModel} (${pre})`
          : pre.replace(/^xlm-roberta-based$/i, 'xlm-roberta-base');

      rows.push({
        model: label,
        score: numberCell(r[4] ?? ''),
        metrics: {
          accuracy: numberCell(r[3] ?? ''),
        },
      });
    }

    return checked(rows, 6);
  },
};

export default board;
