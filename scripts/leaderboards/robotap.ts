// RoboTAP — Google DeepMind and UCL robotic manipulation point-tracking benchmark (arXiv:2308.15975).
// Reads Table III (overall RoboTAP Average Jaccard %) and Table IV (Static/Moving Camera and Static/Moving Points)
// from arXiv:2308.15975 across the four baseline trackers evaluated in the benchmark paper.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { num } from '../lib/html.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2308.15975';

const board: Leaderboard = {
  benchmark: 'robotap',
  feed: FEED,
  url: 'https://robotap.github.io/',
  terms: 'Public arXiv paper published by Google DeepMind and University College London.',
  static: 'paper',
  parts: {
    staticCamera: { name: 'Static camera', group: 'Camera motion' },
    movingCamera: { name: 'Moving camera', group: 'Camera motion' },
    staticPoints: { name: 'Static points', group: 'Point motion' },
    movingPoints: { name: 'Moving points', group: 'Point motion' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const tables = paperTables(html).map(grid);

    const overallTbl = tables.find(
      (g) => g.length >= 4 && g[0].some((c) => /^RoboTAP$/i.test(c.trim())) && g[0].some((c) => /DAVIS/i.test(c)),
    );
    if (!overallTbl) throw new Error('RoboTAP Table III not found in arXiv HTML');

    const partsTbl = tables.find(
      (g) =>
        g.length >= 4 &&
        g[0].some((c) => /Static Camera/i.test(c)) &&
        g[0].some((c) => /Moving Points/i.test(c)),
    );

    const partsByModel = new Map<string, Record<string, number>>();
    if (partsTbl) {
      for (const r of partsTbl.slice(1)) {
        if (r.length < 5) continue;
        const m = r[0].trim();
        if (!m) continue;
        const p: Record<string, number> = {};
        const sc = num(r[1]);
        const mc = num(r[2]);
        const sp = num(r[3]);
        const mp = num(r[4]);
        if (sc !== undefined) p.staticCamera = sc;
        if (mc !== undefined) p.movingCamera = mc;
        if (sp !== undefined) p.staticPoints = sp;
        if (mp !== undefined) p.movingPoints = mp;
        partsByModel.set(m, p);
      }
    }

    const roboCol = overallTbl[0].findIndex((c) => /^RoboTAP$/i.test(c.trim()));
    const rows: LeaderboardRow[] = [];
    for (const r of overallTbl.slice(1)) {
      const model = r[0]?.trim();
      const score = num(r[roboCol]);
      if (!model || score === undefined) continue;
      const row: LeaderboardRow = { model, score };
      const p = partsByModel.get(model);
      if (p && Object.keys(p).length > 0) row.metrics = p;
      rows.push(row);
    }

    return checked(rows, 4);
  },
};

export default board;
