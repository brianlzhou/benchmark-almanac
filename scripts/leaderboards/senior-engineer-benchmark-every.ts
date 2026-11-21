// Senior Engineer Benchmark measures an agent's ability to redesign and implement a production system.
// Every publishes official rubric totals and effort settings in accessible score labels on the benchmark page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://every.to/benchmarks/senior-engineer-benchmark';
const board: Leaderboard = {
  benchmark: 'senior-engineer-benchmark-every', url: PAGE, feed: PAGE,
  terms: 'Every publishes the benchmark results on its public page. https://every.to/benchmarks/senior-engineer-benchmark',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    const point = /aria-label="([^:"]+), ([^"]+): ([0-9]+(?:\.[0-9]+)?) on a 0 to 100 scale"/g;
    for (const match of html.matchAll(point)) rows.push({ model: match[1].trim(), setting: match[2].trim(), score: Number(match[3]) });
    const range = /aria-label="([^:"]+), ([^"]+): score range ([0-9]+) to ([0-9]+) on a 0 to 100 scale"/g;
    for (const match of html.matchAll(range)) rows.push({ model: match[1].trim(), setting: match[2].trim(), score: (Number(match[3]) + Number(match[4])) / 2, low: Number(match[3]), high: Number(match[4]) });
    if (rows.length < 7) throw new Error(`Senior Engineer Benchmark score labels missing: ${rows.length}`);
    return rows;
  },
};
export default board;
