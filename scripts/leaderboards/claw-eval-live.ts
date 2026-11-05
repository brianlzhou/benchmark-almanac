// Claw-Eval-Live. claw-eval-live.github.io (GitHub Pages) builds its leaderboard from an inline script
// literal, `const models = [...]`: per model the pass rate on the 105 tasks (the board's default sort),
// overall completion score, tokens, turns and time. Pass rate is the score. The literal is read as data,
// never run. The board is the v1.0 release (April 2026); later quarterly refreshes change the task set.
// The literal's time (seconds per task; the table's Total Time is it times 105) is kept as metrics.latency.
// Its tokens and turns are not shown on the page, so they are not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://claw-eval-live.github.io/';

const board: Leaderboard = {
  benchmark: 'claw-eval-live',
  url: `${PAGE}#/leaderboard`,
  feed: `${PAGE} (inline "const models" literal, rate)`,
  terms: 'Static project page on GitHub Pages (no robots.txt rules); the site states no terms.',
  aliases: {
    'Qwen 3.5 397B': 'qwen3-5-397b-a17b',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const at = html.indexOf('const models = [');
    if (at < 0) throw new Error('no models literal on the Claw-Eval-Live page');
    const part = html.slice(at + 'const models = '.length, at + 20_000).replace(/:\s*\.(\d)/g, ':0.$1');
    const rows: LeaderboardRow[] = [];
    for (const m of jsLiteral<{ m: string; rate: number; time?: number }[]>(part, 0)) {
      if (m.m && typeof m.rate === 'number')
        rows.push({ model: m.m, score: m.rate, metrics: typeof m.time === 'number' && m.time > 0 ? { latency: m.time } : undefined });
    }
    return rows;
  },
};
export default board;
