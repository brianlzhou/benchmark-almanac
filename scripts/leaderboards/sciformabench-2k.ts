// SciFormaBench-2K — Microsoft Research Asia scientific diagram generation benchmark.
// Reads Table 0 (SciFormaBench-2K, 14 image generation models) from https://microsoft.github.io/SciForma/.
// Table 1 on the same page is a separate benchmark (AIBench) and is intentionally excluded.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = 'https://microsoft.github.io/SciForma/';

const board: Leaderboard = {
  benchmark: 'sciformabench-2k',
  feed: FEED,
  url: FEED,
  terms: 'Public project leaderboard published by Microsoft Research Asia, Peking University, and Zhejiang University.',
  aliases: {
    NanoBananaPro: 'gemini-3-pro-image-preview-nano-banana-pro',
    'FLUX.2-dev-32B': 'flux-2-dev',
    'FLUX.2-klein-base-9B': 'flux-2-klein-9b',
    'Bagel-7B': 'bagel-7b-mot',
  },
  parts: {
    simple: { name: 'Simple', group: 'Difficulty' },
    medium: { name: 'Medium', group: 'Difficulty' },
    hard: { name: 'Hard', group: 'Difficulty' },
    component: { name: 'Component', group: 'Dimension' },
    arrow: { name: 'Arrow', group: 'Dimension' },
    text: { name: 'Text', group: 'Dimension' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const tbl = tables(html).find(
      (t) =>
        t.length > 5 &&
        t[0].length >= 9 &&
        t[0].some((c) => /^Avg$/i.test(c.text)) &&
        t[0].some((c) => /^Component$/i.test(c.text)) &&
        t[0].some((c) => /^Arrow$/i.test(c.text)),
    );
    if (!tbl) throw new Error('SciFormaBench-2K leaderboard table not found');

    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(1)) {
      if (r.length < 9) continue;
      const model = r[0].text.replace(/\s*★\s*$/, '').trim();
      const score = num(r[1].text);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const simple = num(r[2].text);
      const medium = num(r[3].text);
      const hard = num(r[4].text);
      const component = num(r[5].text);
      const arrow = num(r[6].text);
      const textScore = num(r[7].text);
      if (simple !== undefined) metrics.simple = simple;
      if (medium !== undefined) metrics.medium = medium;
      if (hard !== undefined) metrics.hard = hard;
      if (component !== undefined) metrics.component = component;
      if (arrow !== undefined) metrics.arrow = arrow;
      if (textScore !== undefined) metrics.text = textScore;

      const openCell = r[8].text.trim();
      const row: LeaderboardRow = { model, score, metrics };
      if (openCell.includes('✅') || /^yes$/i.test(openCell)) row.open = true;
      else if (openCell.includes('❌') || /^no$/i.test(openCell)) row.open = false;

      const pm = model.match(/-(\d+(?:\.\d+)?)B\b/);
      if (pm) {
        const p = Number(pm[1]);
        if (p > 0) row.params = p;
      }
      rows.push(row);
    }

    if (rows.length < 10) throw new Error(`SciFormaBench-2K parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
