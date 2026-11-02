// VibeVideoBench. vibevideobench.github.io is one static page whose script data sits inline as
// `window.VVB = {...}` (JSON). Its leaderboard is VVB.board[panel]: one row per agent system with `mean`, the
// mean of the five 1 to 5 quality scores over all 239 tasks with a missing video counted as 0 (the record's
// headline), and `mean_v` over delivered videos only. The page opens on the first panel in VVB.panels,
// "Average of 3 panels" (avg), so that panel's `mean` is the score here. Each system runs in its own native
// harness (Claude Code, Codex, Antigravity...), which VVB.models names and this file passes on.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://vibevideobench.github.io/';

interface Vvb {
  models: Record<string, { name: string; harness?: string }>;
  panels: { id: string }[];
  board: Record<string, { sys: string; mean: number }[]>;
}

const board: Leaderboard = {
  benchmark: 'vibevideobench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (inline window.VVB, board.avg mean)`,
  terms: 'Static project page on GitHub Pages (no robots.txt); the page states no terms.',
  aliases: {
    'GLM-5.3 Flash': 'glm-5-3-flash',
  },
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
      if (m && Number.isFinite(r.mean)) rows.push({ model: m.name, score: r.mean, harness: m.harness });
    }
    return rows;
  },
};
export default board;
