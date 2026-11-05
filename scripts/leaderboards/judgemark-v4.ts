// Judgemark v4 on eqbench.com. judgemark-v4.js holds the board as a CSV string. Its score (0 to 1, how well the
// judge's ratings separate writer models) is kept times 100. The cost column ("$39.37") is the US dollars of a
// full judging run, kept as cost with costPer 'run'; ci_low and ci_high are kept times 100 as metrics.ciLow and
// ciHigh. Read through eqbenchCsv in creative-writing-v3.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchCsv, eqbenchFeed } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'judgemark-v4',
  url: 'https://eqbench.com/judgemark-v4.html',
  feed: `${eqbenchFeed('judgemark-v4.js', 'leaderboardDataJudgemarkV4')} score`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  costPer: 'run',
  async fetch() {
    const csv = await eqbenchCsv('judgemark-v4.js', 'leaderboardDataJudgemarkV4');
    if (!csv.length || !('score' in csv[0])) throw new Error('no score column in leaderboardDataJudgemarkV4');
    const name = Object.keys(csv[0])[0];
    const rows: LeaderboardRow[] = [];
    for (const r of csv) {
      const score = parseFloat(r.score) * 100;
      if (!r[name] || r[name] === 'random-baseline' || !Number.isFinite(score)) continue;
      const lo = parseFloat(r.ci_low) * 100;
      const hi = parseFloat(r.ci_high) * 100;
      const cost = parseFloat((r.cost ?? '').replace(/[$,]/g, ''));
      rows.push({
        model: r[name],
        score,
        cost: Number.isFinite(cost) ? cost : undefined,
        metrics: Number.isFinite(lo) && Number.isFinite(hi) ? { ciLow: lo, ciHigh: hi } : undefined,
      });
    }
    return rows;
  },
};
export default board;
