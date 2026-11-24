// PiRhDy Melody Completion evaluates symbolic music retrieval models on ranking the true
// next bar of a melody among distractor bars. This importer reads Table 2 of MusicBERT
// (arXiv:2106.05630), which reports MAP and HITS@k for all six PiRhDy baselines alongside
// MusicBERT small and MusicBERT base under the same retrieval protocol.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2106.05630';

const board: Leaderboard = {
  benchmark: 'pirhdy-melody-completion',
  static: 'paper',
  url: 'https://arxiv.org/abs/2106.05630',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is Mean Average Precision on melody completion from Table 2 of MusicBERT.',
  notModels: /^(?:pianoroll|tonnetz)$/i,
  stats: {
    hitsAt1: { name: 'HITS@1', unit: 'score', better: 'higher' },
    hitsAt5: { name: 'HITS@5', unit: 'score', better: 'higher' },
    hitsAt10: { name: 'HITS@10', unit: 'score', better: 'higher' },
    hitsAt25: { name: 'HITS@25', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find(
      (g) => g[0]?.[0] === 'Model' && g[0]?.[1] === 'Melody Completion' && g[1]?.[1] === 'MAP'
    );
    if (!t) throw new Error('MusicBERT Table 2 (Melody Completion) missing');

    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(3)) {
      const model = r[0]?.trim();
      if (!model) continue;
      rows.push({
        model,
        score: numberCell(r[1] ?? ''),
        metrics: {
          hitsAt1: numberCell(r[2] ?? ''),
          hitsAt5: numberCell(r[3] ?? ''),
          hitsAt10: numberCell(r[4] ?? ''),
          hitsAt25: numberCell(r[5] ?? ''),
        },
      });
    }

    return checked(rows, 8);
  },
};

export default board;
