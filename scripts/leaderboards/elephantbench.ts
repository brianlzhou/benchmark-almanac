// Overall complete-answer percentage C. Partial and failure rates stay metrics. Remote JavaScript is parsed as data, never executed.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const FEED = "https://tencent.github.io/ElephantBench/script.js";
const board: Leaderboard = {
  benchmark: "elephantbench", url: "https://tencent.github.io/ElephantBench/", feed: FEED,
  stats: {
    partial: { name: 'Partial-answer rate', unit: '%', better: 'higher' },
    failure: { name: 'Failure rate', unit: '%', better: 'lower' },
    knowledge: { name: 'Knowledge score', unit: '%', better: 'higher' },
  },
  terms: 'Public maker results; the site has no robots.txt or additional restriction on reading these published values.',
  async fetch() {
    const source = await fetchText(FEED);
    const marker = source.indexOf('const leaderboardData =');
    if (marker < 0) throw new Error('Leaderboard array missing');
    const data = jsLiteral<({ model: string } & Record<string, unknown>)[]>(source, source.indexOf('[', marker));
    const rows = data.map(r => ({ model: r.model, score: Number(r["c"]),
      
      metrics: Object.fromEntries([["p", "partial"], ["f", "failure"], ["k", "knowledge"]].map(([key, label]) => [label, Number(r[key])])) }));
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('Invalid leaderboard rows');
    return rows;
  },
};
export default board;
