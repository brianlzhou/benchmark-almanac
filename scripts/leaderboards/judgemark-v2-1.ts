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
  stats: {
    stability: { name: 'Stability', unit: 'score', better: 'higher', note: 'Consistency of scores across repeated judging runs, from 0 to 1.' },
    separability: { name: 'Separability', unit: 'score', better: 'higher', note: 'Ability to distinguish stronger writers from weaker ones, from 0 to 1.' },
    humanCorr: { name: 'Human correlation', unit: 'score', better: 'higher', note: 'Correlation with human ratings, from 0 to 1.' },
  },
  async fetch() {
    const js = await fetchText(`https://eqbench.com/${FILE}`);
    const at = js.search(new RegExp(`\\b${VARIABLE}\\s*=\\s*\``));
    if (at < 0) throw new Error(`${VARIABLE} not found in ${FILE}`);
    const open = js.indexOf('`', at) + 1;
    const lines = js.slice(open, js.indexOf('`', open)).trim().split('\n');
    return lines
      .map((l) => l.split(','))
      .map(([model, score, stab, sep, corr, cost]): LeaderboardRow => {
        const metrics: Record<string, number> = {};
        const stability = parseFloat(stab), separability = parseFloat(sep), humanCorr = parseFloat(corr);
        if (Number.isFinite(stability)) metrics.stability = stability;
        if (Number.isFinite(separability)) metrics.separability = separability;
        if (Number.isFinite(humanCorr)) metrics.humanCorr = humanCorr;
        return {
          model: (model ?? '').replace(/^\*/, '').trim(),
          score: parseFloat(score),
          link: `https://eqbench.com/results/judgemark-v2/charts/judgemark_3chart_${(model ?? '').replace(/^[*!]+/, '').replace(/\//g, '__').replace(/[^\w\-]/g, '-')}.png`,
          cost: num(cost),
          ...(Object.keys(metrics).length ? { metrics } : {}),
        };
      })
      .filter((r) => r.model && Number.isFinite(r.score));
  },
};
export default board;
