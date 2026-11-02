// CEO-Bench (Princeton). ceobench.com is a static page whose results table reads Model | Bankruptcy |
// Best-run cash | Max survival days | Mean survival days | Turns/week, sorted by Best-run cash: the US
// dollars in the bank at the end of the best of three 500-day runs of the simulated company (starting from
// $1,000,000). That cash is the board's ranking number and the score here, in dollars. The page's
// trajectories file (assets/runs.json) holds the same best runs day by day and is not needed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://ceobench.com/';

const board: Leaderboard = {
  benchmark: 'ceo-bench',
  url: URL,
  feed: `${URL} (static HTML results table, Best-run cash)`,
  terms: 'Static project page; ceobench.com serves no robots.txt (the path returns the page) and publishes no terms.',
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Best-run cash'));
    if (!t) throw new Error('CEO-Bench results table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iCash] = [head.indexOf('Model'), head.indexOf('Best-run cash')];
    return t.slice(1).map((r) => ({ model: r[iModel]?.text ?? '', score: num(r[iCash]?.text) ?? NaN }));
  },
};
export default board;
