// VibeVideoBench. vibevideobench.github.io is one static page whose script data sits inline as
// `window.VVB = {...}` (JSON). Its leaderboard is VVB.board[panel]: one row per agent system with `mean`, the
// mean of the five 1 to 5 quality scores over all 239 tasks with a missing video counted as 0 (the record's
// headline), and `mean_v` over delivered videos only. The page opens on the first panel in VVB.panels,
// "Average of 3 panels" (avg), so that panel's `mean` is the score here. Each system runs in its own native
// harness (Claude Code, Codex, Antigravity...), which VVB.models names and this file passes on.
// Each row also carries the board's other columns in `metrics`: mean_v ("meanDelivered", 1 to 5), the share of
// tasks with a delivered video ("delivered", %) and pass_rate ("pass", %).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://vibevideobench.github.io/';

interface Vvb {
  models: Record<string, { name: string; harness?: string }>;
  panels: { id: string }[];
  board: Record<string, { sys: string; mean: number; mean_v?: number; n?: number; video?: number; pass_rate?: number }[]>;
}

const board: Leaderboard = {
  benchmark: 'vibevideobench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (inline window.VVB, board.avg mean)`,
  terms: 'Static project page on GitHub Pages (no robots.txt); the VibeVideoBench repository is Apache-2.0.',
  async fetch() {
    const html = await fetchText(PAGE);
    const at = html.indexOf('window.VVB = ');
    if (at < 0) throw new Error('window.VVB not found');
    const v = jsonAt<Vvb>(html, at + 'window.VVB = '.length);
    const panel = v.panels?.[0]?.id;
    const list = panel ? v.board?.[panel] : undefined;
    if (!list?.length) throw new Error(`no board for panel ${panel}`);
    const rows: LeaderboardRow[] = [];
    for (const r of list) {
      const m = v.models[r.sys];
      if (!m || !Number.isFinite(r.mean)) continue;
      const metrics: Record<string, number> = {};
      if (typeof r.mean_v === 'number') metrics.meanDelivered = r.mean_v;
      if (r.n && typeof r.video === 'number') metrics.delivered = Number(((100 * r.video) / r.n).toFixed(2));
      if (typeof r.pass_rate === 'number') metrics.pass = Number((100 * r.pass_rate).toFixed(2));
      rows.push({ model: m.name, score: r.mean, harness: m.harness, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
