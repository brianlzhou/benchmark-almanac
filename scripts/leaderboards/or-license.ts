// OR-License. www.or-license.com/leaderboard is a static page whose table is also published as
// assets/or-license-results.csv: rank, model, reasoning effort, feasibility (percent of client projects with
// a feasible delivered solution) and DAQ (decision-adjusted quality), each with its standard deviation. The
// board's rank follows feasibility, so feasibility_pct is the score; the reasoning effort is the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://www.or-license.com/leaderboard';
const FEED = 'https://www.or-license.com/assets/or-license-results.csv';

const board: Leaderboard = {
  benchmark: 'or-license',
  url: PAGE,
  feed: `${FEED} (feasibility_pct)`,
  terms: 'Static CSV on the project site; robots.txt allows all paths and the OR-License repository is Apache-2.0.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.feasibility_pct);
      if (!r.model || !Number.isFinite(score)) continue;
      rows.push({ model: r.model.trim(), score, setting: r.reasoning_effort?.trim().toLowerCase() || undefined });
    }
    if (rows.length < 5) throw new Error(`only ${rows.length} OR-License rows`);
    return rows;
  },
};
export default board;
