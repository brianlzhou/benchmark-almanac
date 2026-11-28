// Qwen3GuardTest — Qwen safety moderation benchmark for reasoning traces and streaming responses.
// Reads Table 3 (English Response -> Think column, explicitly linked to Qwen/Qwen3GuardTest in arXiv:2510.14276)
// scoring 13 guard model configurations (7 baselines plus Qwen3Guard-Gen 0.6B/4B/8B in strict and loose modes).

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { num } from '../lib/html.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2510.14276';

const board: Leaderboard = {
  benchmark: 'qwen3guardtest',
  feed: FEED,
  url: 'https://huggingface.co/datasets/Qwen/Qwen3GuardTest',
  terms: 'Public arXiv technical report published by the Qwen team.',
  static: 'paper',
  headline: 'F1 score (%) on the Qwen3GuardTest thinking-content moderation split (Think column in Table 3 of the Qwen3Guard technical report).',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const tbl = paperTables(html)
      .map(grid)
      .find(
        (g) =>
          g.length >= 10 &&
          g[0].some((c) => /English Response/i.test(c)) &&
          g[1].some((c) => /^Think$/i.test(c.trim())) &&
          g.some((r) => /LlamaGuard3-8B/i.test(r[0] ?? '')),
      );
    if (!tbl) throw new Error('Qwen3GuardTest Table 3 (Think column) not found in arXiv HTML');

    const thinkCol = tbl[1].findIndex((c) => /^Think$/i.test(c.trim()));
    if (thinkCol < 0) throw new Error('Think column not found in Qwen3Guard Table 3');

    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(2)) {
      const model = r[0]?.trim();
      const modeCell = r[1]?.trim();
      const score = num(r[thinkCol]);
      if (!model || score === undefined || /^Previous Best$/i.test(model)) continue;

      const row: LeaderboardRow = { model, score };
      if (modeCell && modeCell !== model && /^(strict|loose)$/i.test(modeCell)) {
        row.setting = modeCell.toLowerCase();
      }
      const pm = model.match(/-(\d+(?:\.\d+)?)B\b/i);
      if (pm) {
        const p = Number(pm[1]);
        if (p > 0) row.params = p;
      }
      rows.push(row);
    }

    return checked(rows, 10);
  },
};

export default board;
