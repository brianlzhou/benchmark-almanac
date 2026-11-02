// IMProofBench (ETH Zurich). The home page shows the top models "by percentage of benchmark questions with
// complete and correct solutions"; the full board, /questions/leaderboard/, is server-rendered with its
// chart data inline: per model {"model_name", "tier", "percentages": [no progress, minor, major,
// complete]} as percents of graded questions. The score is the last value, the complete-solution share the
// home page ranks by (GPT-5.4 49.3%). Names carry the tool setting in parentheses ("(web search)"), which
// becomes the setting. The page's pairwise "score" table is a different, subquestion-level measure.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://improofbench.math.ethz.ch';
const PAGE = `${SITE}/questions/leaderboard/`;

const board: Leaderboard = {
  benchmark: 'improofbench',
  url: `${SITE}/`,
  feed: `${PAGE} (inline grade-distribution data, complete share)`,
  terms: 'Server-rendered public page; the site serves no robots.txt (404) and states no terms for the leaderboard.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const seen = new Set<string>();
    const rows: LeaderboardRow[] = [];
    for (const m of html.matchAll(/\{"model_name": "([^"]+)", "tier": \d+, "percentages": \[([^\]]+)\]/g)) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      const p = m[2].split(',').map(Number);
      if (p.length !== 4) continue;
      const tool = /\(([^)]+)\)$/.exec(m[1])?.[1];
      rows.push({ model: m[1].replace(/\s*\([^)]+\)$/, ''), score: p[3], setting: tool?.toLowerCase() });
    }
    if (!rows.length) throw new Error('no IMProofBench grade data found');
    return rows;
  },
};
export default board;
