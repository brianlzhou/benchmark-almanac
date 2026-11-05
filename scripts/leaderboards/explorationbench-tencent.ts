// ExplorationBench (Fudan, Tencent Hunyuan, Tsinghua). explorationbench.com builds its leaderboard from
// /assets/js/results.js, a generated data script (`EB.leaderboard = {...}`) with one table per alien world.
// The page opens on AlienCode and ranks by M4 ("Best@3, the highest M4": held-out accuracy after full
// autonomous exploration, the best of three trajectories, 0 to 100), so AlienCode M4 is the score. The
// AlienLogic table, the page's second tab, is not read. The row's reasoning effort ("max", "xhigh") is the
// setting. Metrics: M0, the Best@3 trajectory's accuracy before exploration (`m0`), and the table's Mean@3 and
// Worst over all three trajectories (`mean3`, `worst3`). The O@M0 and A4+O oracle columns are other conditions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const SITE = 'https://www.explorationbench.com/';
const FEED = `${SITE}assets/js/results.js`;

const board: Leaderboard = {
  benchmark: 'explorationbench-tencent',
  url: SITE,
  feed: `${FEED} (EB.leaderboard.code, M4)`,
  terms: 'Generated data script on explorationbench.com; robots.txt allows general agents (content signals: search yes, AI training no, use reference) and the site publishes no terms of use.',
  async fetch() {
    type Row = { m: string; r?: string; m4?: number; m0?: number; mean?: number; worst?: number };
    const lb = jsonAfter<Record<string, { rows: Row[] }>>(await fetchText(FEED), 'EB.leaderboard =');
    if (!lb.code?.rows) throw new Error('AlienCode table not found in ExplorationBench results.js');
    const rows: LeaderboardRow[] = [];
    for (const r of lb.code.rows) {
      if (!r.m || typeof r.m4 !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [key, v] of [['m0', r.m0], ['mean3', r.mean], ['worst3', r.worst]] as const) if (typeof v === 'number') metrics[key] = v;
      rows.push({ model: r.m, score: r.m4, setting: r.r || undefined, metrics });
    }
    return rows;
  },
};
export default board;
