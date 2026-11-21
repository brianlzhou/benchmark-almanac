// Balatro Bench ranks fixed-seed runs by ante reached, with best hand as the tiebreaker. The results Markdown table includes context and coaching for each run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/Michael-Andrzejewski/balatro-bench/master/bench-results.md";

const board: Leaderboard = {
  benchmark: "balatro-bench-andrzejewski",
  url: "https://github.com/Michael-Andrzejewski/balatro-bench/blob/master/bench-results.md",
  feed,
  terms: "The repository lists no license. https://github.com/Michael-Andrzejewski/balatro-bench The feed host returns no robots.txt.",
  stats: {
    bestHand: { name: 'Best single hand', unit: 'count', better: 'higher' },
    rank: { name: 'Rank', unit: 'count', better: 'lower' },
  },
  aliases: {"Sol / GPT-5.6": "gpt-5-6-sol", "Wake / Fable 5.1": "claude-fable-5-1"},
  async fetch() {
    const source = await fetchText(feed);
    const table = markdownTables(source).find(([head]) => head.join('|') === 'Rank|Player|Ante|Won base game?|Best single hand|Date|Notes');
    if (!table) throw new Error('Missing ranked runs');
    const lines = source.split(/\r?\n/).filter(line => /^\| (?:\d+|unranked)/.test(line));
    const rows: LeaderboardRow[] = [];
    for (const [i, [rank, player, ante, won, best, date]] of table.slice(1).entries()) {
      if (/\(human|\(no AI/.test(player)) continue;
      const label = player.match(/^(.+?) \((.+)\)$/);
      const score = Number(ante.match(/(?:endless to |stopped at )(\d+)/)?.[1] ?? ante.match(/^\d+/)?.[0]);
      if (!label || !Number.isFinite(score)) throw new Error('Invalid Balatro result: ' + player);
      const [model, planner] = label[1].split(' + ');
      const hands = best.replace(/,/g, '').match(/\d+(?:\.\d+)?(?:e\d+)?/gi);
      if (!hands) throw new Error('Missing best hand');
      const metrics: Record<string, number> = { bestHand: Math.max(...hands.map(Number)), wonBaseGame: Number(won === 'Yes') };
      if (/^\d+$/.test(rank)) metrics.rank = Number(rank);
      const path = lines[i]?.match(/\[(?:result|journal|screenshot)\]\(([^)]+)\)/i)?.[1];
      rows.push({ model, setting: label[2], score, date, metrics,
        harness: planner, models: planner ? [model, planner.replace(/ planner$/, '')] : undefined,
        link: path ? new URL(path, 'https://github.com/Michael-Andrzejewski/balatro-bench/blob/master/').href : undefined });
    }
    if (rows.length < 21) throw new Error('Incomplete Balatro runs');
    return rows;
  },
};
export default board;
