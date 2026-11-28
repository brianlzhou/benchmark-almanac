// Ludobench rates backgammon players with Glicko-2. The default AI standings give each rated model, its rating uncertainty and cost per game.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://ludobench.com/leaderboards";

const board: Leaderboard = {
  benchmark: "ludobench-backgammon",
  url: "https://ludobench.com/leaderboards",
  feed,
  terms: "The terms allow Ludobench to publish anonymized match records. They give no third-party license for standings. https://ludobench.com/terms The feed host publishes robots.txt at https://ludobench.com/robots.txt.",
  stats: { latency:{name:'Think time',unit:'seconds',better:'lower'} },
  async fetch() {
    const page = await fetchText(feed);
    const fragment = page.match(/<table\b[^>]*>(?:(?!<\/table>)[\s\S])*?Backgammon(?:(?!<\/table>)[\s\S])*?<\/table>/i)?.[0];
    const table = fragment && tables(fragment)[0];
    if (!table || !table[0].some(c => c.text === 'Rating')) throw new Error('Missing backgammon standings');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [, model, rating, matches, win, fallback, think, cost] = cells.map(c => c.text);
      if (rating === 'unrated') continue;
      const interval = rating.match(/(\d+)\s*±\s*(\d+)/);
      if (!interval || !model) throw new Error('Invalid player rating');
      const score = Number(interval[1]), width = Number(interval[2]);
      const metrics: Record<string, number> = { latency: Number(think) / 1000 };
      if (num(win) !== undefined) metrics.winRate = num(win)!;
      rows.push({ model, score, low: score - width, high: score + width, cost: num(cost), metrics });
    }
    if (rows.length < 6) throw new Error('Incomplete backgammon standings');
    return rows;
  },
};
export default board;
