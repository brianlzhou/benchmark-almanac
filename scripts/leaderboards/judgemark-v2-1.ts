// Judgemark v2.1 on eqbench.com (judgemark-v2.html, titled v2.1, now a legacy board). judgemark-v2.js holds the
// board as a CSV string with no header row. The page names the columns model, judgemark_score, stability,
// separability, human_corr and cost, so the fields are read by position. judgemark_score (0 to 100) is the
// score. The cost ("$10.43") is what the page calls the cost to complete one run of the benchmark via
// OpenRouter, so it is a run cost, as `costPer` says. The header-less CSV is read here, with the shared terms
// and aliases from creative-writing-v3.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed } from './creative-writing-v3.ts';

const FILE = 'judgemark-v2.js';
const VARIABLE = 'leaderboardDataV2';

const board: Leaderboard = {
  benchmark: 'judgemark-v2-1',
  url: 'https://eqbench.com/judgemark-v2.html',
  feed: `${eqbenchFeed(FILE, VARIABLE)} judgemark_score`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  costPer: 'run',
  async fetch() {
    const js = await fetchText(`https://eqbench.com/${FILE}`);
    const at = js.search(new RegExp(`\\b${VARIABLE}\\s*=\\s*\``));
    if (at < 0) throw new Error(`${VARIABLE} not found in ${FILE}`);
    const open = js.indexOf('`', at) + 1;
    const lines = js.slice(open, js.indexOf('`', open)).trim().split('\n');
    return lines
      .map((l) => l.split(','))
      .map(([model, score, , , , cost]): LeaderboardRow => ({ model: (model ?? '').replace(/^\*/, '').trim(), score: parseFloat(score), cost: num(cost) }))
      .filter((r) => r.model && Number.isFinite(r.score));
  },
};
export default board;
