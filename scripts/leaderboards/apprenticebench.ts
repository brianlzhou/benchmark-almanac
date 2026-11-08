// ApprenticeBench (NeoCognition). apprenticebench.com is a Vite app whose leaderboard rows ship in its
// main bundle as a literal array: per run the model id, harness (Claude Code or Codex), reasoning effort,
// bills passed out of 100, cost and tokens per task. The board ranks by cumulative success rate, passed / n,
// which is the score as a percent. The bundle name is hashed, so it is found in the page first; the
// literal is read as data, never run. Cost is per task, as the board reports it. The board's tokens per task
// count all types (cache reads, fresh input, cache writes and output), not output tokens, so they are kept as totalTokensPerTask metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://apprenticebench.com/';

interface Run {
  model: string;
  passed: number;
  n: number;
  cost?: number;
  tokens?: number;
  harness?: string;
  effort?: string;
}

const board: Leaderboard = {
  benchmark: 'apprenticebench',
  url: PAGE,
  feed: `${PAGE}assets/index-*.js (leaderboard literal, passed / n)`,
  terms: 'Public app bundle; apprenticebench.com has no robots.txt rules and states no terms.',
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('no bundle on the ApprenticeBench page');
    const js = await fetchText(new URL(src, PAGE).href);
    const at = js.indexOf('[{model:"');
    if (at < 0) throw new Error('no leaderboard literal in the bundle');
    // the literal writes some fractions as ".77"; JSON needs the leading zero
    const part = js.slice(at, at + 50_000).replace(/:\.(\d)/g, ':0.$1');
    const rows: LeaderboardRow[] = [];
    for (const r of jsLiteral<Run[]>(part, 0)) {
      if (!r.model || !(r.n > 0)) continue;
      rows.push({
        model: r.model,
        score: Number(((100 * r.passed) / r.n).toFixed(2)),
        setting: r.effort,
        harness: r.harness,
        cost: r.cost,
        metrics:typeof r.tokens==='number'?{totalTokensPerTask:r.tokens}:undefined,
      });
    }
    return rows;
  },
};
export default board;
