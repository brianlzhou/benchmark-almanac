// EQ-Bench 3 on eqbench.com (now a legacy board, replaced by eq-bench-4.ts). eqbench3.js holds the board as a
// CSV string. Its elo_norm, the normalized Elo the page ranks by, is the score (rubric_0_100 is a breakdown). Read
// through eqbenchRows in creative-writing-v3.ts. The normalized Elo's confidence interval, ci_low_norm and
// ci_high_norm, rubric scores and per-model reports accompany the Elo.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'eq-bench-3',
  url: 'https://eqbench.com/eqbench3.html',
  feed: `${eqbenchFeed('eqbench3.js', 'leaderboardDataEQBench3')} elo_norm`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  stats: {
    rubric_0_100: { name: 'Rubric score', unit: 'score', better: 'higher', note: 'Judge rubric score from 0 to 100.' },
    humanlike: { name: 'Humanlike', unit: 'score' },
    safe: { name: 'Safety', unit: 'score', better: 'higher' },
    assertive: { name: 'Assertiveness', unit: 'score' },
    social_iq: { name: 'Social IQ', unit: 'score', better: 'higher' },
    warm: { name: 'Warmth', unit: 'score' },
    analytical: { name: 'Analytical', unit: 'score' },
    insightful: { name: 'Insightfulness', unit: 'score', better: 'higher' },
    empathy: { name: 'Empathy', unit: 'score', better: 'higher' },
    compliant: { name: 'Compliance', unit: 'score' },
    moral: { name: 'Moral', unit: 'score' },
    pragmatic: { name: 'Pragmatism', unit: 'score' },
  },
  async fetch() {
    const traits = 'rubric_0_100 humanlike safe assertive social_iq warm analytical insightful empathy compliant moral pragmatic'.split(' ');
    const rows = await eqbenchRows('eqbench3.js', 'leaderboardDataEQBench3', 'elo_norm', 1, {
      ciLow: 'ci_low_norm', ciHigh: 'ci_high_norm', ...Object.fromEntries(traits.map(key => [key, key])),
    });
    return rows.map(row => {
      const slug = row.model.replace(/\//g, '__').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      return { ...row, low: row.metrics?.ciLow, high: row.metrics?.ciHigh, link: `https://eqbench.com/results/eqbench3_reports/${slug}.html` };
    });
  },
};
export default board;
