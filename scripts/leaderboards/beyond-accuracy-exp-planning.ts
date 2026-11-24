// Beyond Accuracy (EPFL Schwaller Group): evaluates LLM agents on experimental planning in chemistry, measuring
// decision accuracy (%) on selecting informative experiments with 95% confidence intervals. Reads the direct CSV
// at schwallergroup.github.io/beyond-accuracy/data/results.csv and excludes classical numerical baselines.
// Headline 95% CI columns quoted verbatim from results.csv: "ci95_low_percent,ci95_high_percent" -> row.low / row.high.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://schwallergroup.github.io/beyond-accuracy/';
const FEED = `${PAGE}data/results.csv`;

const board: Leaderboard = {
  benchmark: 'beyond-accuracy-exp-planning',
  url: PAGE,
  feed: FEED,
  terms: 'Published openly on GitHub Pages by the EPFL Schwaller Group with no robots.txt restrictions.',
  notModels: /^(Maximin LHS|Bayesian optimization)$/i,
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      if (r.type?.trim().toLowerCase() === 'baseline') continue;
      const model = r.method?.trim();
      const score = Number(r.accuracy_percent);
      const low = Number(r.ci95_low_percent);
      const high = Number(r.ci95_high_percent);
      if (!model || ![score, low, high].every(Number.isFinite)) continue;
      out.push({ model, score, low, high });
    }
    if (out.length < 8) throw new Error(`Beyond Accuracy returned only ${out.length} rows`);
    return out;
  },
};
export default board;
