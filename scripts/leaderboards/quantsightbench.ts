// Mean log interval score, lower is better; agentic setting with high reasoning effort. Remote JavaScript is parsed as data, never executed.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const FEED = "https://quantsightbench.com/data.js";
const board: Leaderboard = {
  benchmark: "quantsightbench", url: "https://quantsightbench.com/", feed: FEED,
  terms: 'Public maker results; the site has no robots.txt or additional restriction on reading these published values.',
  stats: { coverage: { name: 'Coverage', unit: 'score', better: 'higher', note: 'Coverage from 0 to 1.' } },
  async fetch() {
    const source = await fetchText(FEED);
    const marker = source.indexOf('const LEADERBOARD_DATA =');
    if (marker < 0) throw new Error('Leaderboard array missing');
    const data = jsLiteral<({ model: string } & Record<string, unknown>)[]>(source, source.indexOf('[', marker));
    const rows = data.map(r => ({ model: r.model, score: Number(r["mean_log_is"]),
      setting: 'agentic, high reasoning effort',
      metrics: Object.fromEntries([["coverage", "coverage"]].map(([key, label]) => [label, Number(r[key])])) }));
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('Invalid leaderboard rows');
    return rows;
  },
};
export default board;
