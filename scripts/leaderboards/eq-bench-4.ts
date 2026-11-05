// EQ-Bench 4 on eqbench.com. The leaderboard page loads eqbench4/eqbench4_data.js, a generated script that
// assigns one JSON object, EQBENCH4_DATA: per model an Elo rating (fitted from a three-judge pairwise
// panel over 120 roleplay scenarios) with its 95% interval, rank, trait dimensions and ability scores.
// Elo is the ranking and the score. The object is read as data (JSON after the assignment), never run.
// EQ-Bench 3 now sits on the legacy boards and is not read here. The Elo's 95% interval (ci_low, ci_high)
// is kept as metrics.ciLow and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = 'https://eqbench.com/eqbench4/eqbench4_data.js';

interface Model {
  model: string;
  display?: string;
  elo?: number;
  ci_low?: number;
  ci_high?: number;
  rank?: number;
}

const board: Leaderboard = {
  benchmark: 'eq-bench-4',
  url: 'https://eqbench.com/',
  feed: FEED,
  terms: 'Generated data file on the eqbench.com GitHub Pages site, which states no terms or license for the scores.',
  aliases: {},
  async fetch() {
    const data = jsonAfter<{ models: Model[] }>(await fetchText(FEED), 'const EQBENCH4_DATA =');
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      if (typeof m.elo !== 'number') continue;
      const ci = typeof m.ci_low === 'number' && typeof m.ci_high === 'number' ? { metrics: { ciLow: m.ci_low, ciHigh: m.ci_high } } : {};
      rows.push({ model: m.model.trim(), score: m.elo, ...ci });
    }
    if (!rows.length) throw new Error('no models in EQBENCH4_DATA');
    return rows;
  },
};
export default board;
