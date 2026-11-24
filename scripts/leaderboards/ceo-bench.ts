// CEO-Bench (Princeton). ceobench.com is a static page whose results table reads Model | Bankruptcy |
// Best-run cash | Max survival days | Mean survival days | Turns/week, sorted by Best-run cash: the US
// dollars in the bank at the end of the best of three 500-day runs of the simulated company (starting from
// $1,000,000). That cash is the board's ranking number and the score here, in dollars. The page's
// table also reports the bankruptcy count, the mean and spread of final cash over the three runs, and survival
// times. Earlier versions of the table had a turns-per-week column, so that stat is kept when present.
// The table ends with two rows that are not models, a rule-based baseline and an estimated upper bound on final
// cash. They have no runs (an empty Bankruptcy cell), and the importer leaves them out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://ceobench.com/';

const board: Leaderboard = {
  benchmark: 'ceo-bench',
  url: URL,
  feed: `${URL} (static HTML results table, Best-run cash)`,
  terms: 'Static project page; ceobench.com serves no robots.txt (the path returns the page) and publishes no terms.',
  stats: { bankruptcies: { name: 'Bankruptcies', unit: 'count', better: 'lower' }, maxSurvivalDays: { name: 'Maximum survival days', unit: 'count', better: 'higher' }, meanSurvivalDays: { name: 'Mean survival days', unit: 'count', better: 'higher' }, survivalDaysSpread: { name: 'Survival days spread', unit: 'count', better: 'lower' }, meanCash: { name: 'Mean final cash', unit: 'usd', better: 'higher', note: 'Mean cash at the end of the three runs.' }, cashSpread: { name: 'Final cash spread', unit: 'usd', note: 'Standard deviation of final cash over the three runs.' }, turnsPerWeek: { name: 'Turns per week', unit: 'count' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Best-run cash'));
    if (!t) throw new Error('CEO-Bench results table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iCash] = [head.indexOf('Model'), head.indexOf('Best-run cash')];
    const value = (r: (typeof t)[number], label: string) => head.includes(label) ? r[head.indexOf(label)]?.text ?? '' : '';
    // a model row has its runs in the Bankruptcy cell ("1/3"); the baseline and the upper bound have none
    const models = t.slice(1).filter(r => /^\d+\s*\/\s*\d+$/.test(value(r, 'Bankruptcy')));
    if (models.length < 20) throw new Error(`CEO-Bench table changed: only ${models.length} model rows`);
    return models.map(r => {
      const runs = value(r, 'Bankruptcy').match(/^(\d+)\s*\/\s*(\d+)$/);
      const [mean, spread] = value(r, 'Mean survival days').split(/±|&plusmn;/);
      const [meanCash, cashSpread] = value(r, 'Mean ± std. cash').split(/±|&plusmn;/);
      const metrics: Record<string, number> = {};
      const values = {bankruptcies: runs ? Number(runs[1]) : undefined, maxSurvivalDays: num(value(r, 'Max survival days')),
        meanSurvivalDays: num(mean), survivalDaysSpread: num(spread ?? ''), meanCash: num(meanCash ?? ''),
        cashSpread: num(cashSpread ?? ''), turnsPerWeek: num(value(r, 'Turns/week'))};
      for (const [key, n] of Object.entries(values)) if (n !== undefined) metrics[key] = n;
      return {model: r[iModel]?.text ?? '', score: num(r[iCash]?.text) ?? NaN, trials: runs ? Number(runs[2]) : undefined, metrics};
    });
  },
};
export default board;
