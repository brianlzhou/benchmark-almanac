// STAR evaluates situated reasoning in real-world videos across four question types:
// Interaction, Sequence, Prediction, and Feasibility. This importer reads Table 2 of
// arXiv:2405.09711, using the unweighted mean accuracy across the four question types as
// the headline while excluding random and frequent-answer baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2405.09711';

const board: Leaderboard = {
  benchmark: 'star-situated-video-reasoning',
  static: 'paper',
  url: 'https://arxiv.org/abs/2405.09711',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is the unweighted mean accuracy in percent across the four STAR question types in Table 2.',
  notModels: /^Q-type\s*\((?:Random|Frequent)\)$/i,
  parts: {
    interaction: { name: 'Interaction', group: 'Question type', unit: '%', better: 'higher' },
    sequence: { name: 'Sequence', group: 'Question type', unit: '%', better: 'higher' },
    prediction: { name: 'Prediction', group: 'Question type', unit: '%', better: 'higher' },
    feasibility: { name: 'Feasibility', group: 'Question type', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find(
      (g) => g[0]?.[0] === 'Model Name' && g[1]?.[1] === 'Interaction' && g[1]?.[4] === 'Feasibility'
    );
    if (!t) throw new Error('STAR Table 2 missing');

    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const raw = (r[0] ?? '').replace(/\s*\[\s*\d+\s*\]/g, '').trim();
      if (!raw) continue;
      const interaction = numberCell(r[1] ?? '');
      const sequence = numberCell(r[2] ?? '');
      const prediction = numberCell(r[3] ?? '');
      const feasibility = numberCell(r[4] ?? '');
      const mean = Number(((interaction + sequence + prediction + feasibility) / 4).toFixed(2));
      rows.push({
        model: raw,
        score: mean,
        metrics: { interaction, sequence, prediction, feasibility },
      });
    }

    return checked(rows, 7);
  },
};

export default board;
