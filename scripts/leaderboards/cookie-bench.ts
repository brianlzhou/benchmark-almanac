// Cookie-Bench — Interactive front-end web generation benchmark (arXiv:2605.30000).
// Reads Table 1 from arXiv:2605.30000 scoring 13 frontier models across both React (agent scaffold)
// and HTML (direct chat) generation modes, with Dynamic/Static totals and Functionality/Aesthetics stats.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { num } from '../lib/html.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2605.30000';

const board: Leaderboard = {
  benchmark: 'cookie-bench',
  feed: FEED,
  url: 'https://github.com/Haoyue-Yang/Cookie-Bench',
  terms: 'Public arXiv paper published by the Cookie-Bench authors.',
  static: 'paper',
  aliases: {
    'Opus 4.7': 'claude-opus-4-7',
    'Opus 4.6': 'claude-opus-4-6',
    'DS-V4-Pro': 'deepseek-v4-pro',
    'DS-V4-Flash': 'deepseek-v4-flash',
    'Mimo-V2-Pro': 'mimo-v2-pro',
    'Qwen3.6-27B': 'qwen3-6-27b',
    'Qwen3.6-35B-A3B': 'qwen-3-6-35b-a3b',
    'Qwen3.6-Plus': 'qwen-3-6-plus',
    'Kimi-K2.6': 'kimi-k2-6',
  },
  parts: {
    dynamic: { name: 'Dynamic', group: 'App type' },
    static: { name: 'Static', group: 'App type' },
  },
  stats: {
    dynamicFunc: { name: 'Dynamic functionality', unit: '%', better: 'higher' },
    dynamicAes: { name: 'Dynamic aesthetics', unit: '%', better: 'higher' },
    staticFunc: { name: 'Static functionality', unit: '%', better: 'higher' },
    staticAes: { name: 'Static aesthetics', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const tbl = paperTables(html)
      .map(grid)
      .find(
        (g) =>
          g.length >= 12 &&
          g[0].length >= 15 &&
          g[0].some((c) => /React/i.test(c)) &&
          g[0].some((c) => /HTML/i.test(c)),
      );
    if (!tbl) throw new Error('Cookie-Bench Table 1 not found in arXiv HTML');

    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(3)) {
      if (r.length < 15) continue;
      const model = r[0].trim();
      if (!model) continue;

      const modes: { setting: string; offset: number }[] = [
        { setting: 'React (agent scaffold)', offset: 1 },
        { setting: 'HTML (direct chat)', offset: 8 },
      ];
      for (const { setting, offset } of modes) {
        const score = num(r[offset + 6]);
        if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        const dFunc = num(r[offset]);
        const dAes = num(r[offset + 1]);
        const dTot = num(r[offset + 2]);
        const sFunc = num(r[offset + 3]);
        const sAes = num(r[offset + 4]);
        const sTot = num(r[offset + 5]);
        if (dFunc !== undefined) metrics.dynamicFunc = dFunc;
        if (dAes !== undefined) metrics.dynamicAes = dAes;
        if (dTot !== undefined) metrics.dynamic = dTot;
        if (sFunc !== undefined) metrics.staticFunc = sFunc;
        if (sAes !== undefined) metrics.staticAes = sAes;
        if (sTot !== undefined) metrics.static = sTot;
        rows.push({ model, score, setting, metrics });
      }
    }

    return checked(rows, 20);
  },
};

export default board;
