// Soohak evaluates frontier language models on research-level and graduate mathematics
// problems written by mathematicians across Mini, Challenge (n=340), and Refusal (n=99) sets.
// This importer reads Table 2 of arXiv:2605.09063, using Challenge Avg@3 accuracy in percent
// as the headline alongside Mini and Refusal Avg@3 parts, Pass@3 stats, and open-weights flags.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2605.09063';

const board: Leaderboard = {
  benchmark: 'soohak',
  static: 'paper',
  url: 'https://arxiv.org/abs/2605.09063',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is SOOHAK Challenge (n=340) Avg@3 accuracy in percent from Table 2.',
  aliases: {
    'Qwen3-235B-A22B-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'Kimi-2.5': 'kimi-k2-5',
  },
  parts: {
    miniAvg3: { name: 'SOOHAK-Mini Avg@3', group: 'Subset (Avg@3)', unit: '%', better: 'higher' },
    refusalAvg3: { name: 'SOOHAK Refusal Avg@3', group: 'Subset (Avg@3)', unit: '%', better: 'higher' },
  },
  stats: {
    challengePass3: { name: 'SOOHAK Challenge Pass@3', unit: '%', better: 'higher' },
    miniPass3: { name: 'SOOHAK-Mini Pass@3', unit: '%', better: 'higher' },
    refusalPass3: { name: 'SOOHAK Refusal Pass@3', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t = tables.find(
      (g) => g[0]?.[0] === 'Model' && /SOOHAK-Mini/i.test(g[0]?.[1] ?? '') && g[2]?.[1] === 'Avg@3'
    );
    if (!t) throw new Error('Soohak Table 2 missing');

    const rows: LeaderboardRow[] = [];
    let open: boolean | undefined;

    for (const r of t.slice(3)) {
      const model = r[0]?.trim() ?? '';
      if (!model) continue;
      if (/^Closed frontier$/i.test(model)) {
        open = false;
        continue;
      }
      if (/^Open-weight/i.test(model)) {
        open = true;
        continue;
      }

      rows.push({
        model,
        score: numberCell(r[3] ?? ''),
        ...(open !== undefined ? { open } : {}),
        metrics: {
          miniAvg3: numberCell(r[1] ?? ''),
          miniPass3: numberCell(r[2] ?? ''),
          challengePass3: numberCell(r[4] ?? ''),
          refusalAvg3: numberCell(r[5] ?? ''),
          refusalPass3: numberCell(r[6] ?? ''),
        },
      });
    }

    return checked(rows, 11);
  },
};

export default board;
