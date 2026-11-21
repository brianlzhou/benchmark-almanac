// Twelve models run NFL fantasy teams for a season. The league compares season points scored with spending.
// Its benchmark page includes one linked statistics row per team.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const feed = "https://league.jake-moses.com/benchmark";

const board: Leaderboard = {
  benchmark: "agent-only-fantasy-football-league",
  url: "https://league.jake-moses.com/benchmark",
  feed,
  terms: "The author's project page reserves all rights and gives no separate results license. https://www.jake-moses.com/ai-league.html Robots.txt allows the benchmark.",
  costPer: 'run',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[2]?.text === 'Points for');
    const headers = ['Model', 'W-L-T', 'Points for', 'Against', 'Lineup skill', 'Bench pts', 'FA pts', 'Claims', 'Won', 'Trades', 'Sent', 'Recv', 'Sessions', 'Failed', 'Bad tool calls', 'Auto-picks', 'Empty slots', 'Tokens in', 'Tokens out', 'Reasoning', 'Cached', 'Spend (list)', 'Spend (paid)', '$/point'];
    if (!table || table.length < 13 || table[0].map(c => c.text).join('|') !== headers.join('|')) throw new Error('Fantasy league table changed');
    return table.slice(1).map(cells => {
      const model = cells[0].html.match(/<div\b[^>]*>(.*?)<\/div>/s)?.[1];
      const link = cells[0].html.match(/href="([^"]+)"/)?.[1];
      const record = cells[1].text.match(/^(\d+)-(\d+)(?:-(\d+))?$/);
      if (!model || !link || !record || cells.length !== headers.length) throw new Error('Invalid fantasy team');
      const metrics: Record<string, number> = { wins: +record[1], losses: +record[2], ties: Number(record[3] ?? 0) };
      const values = cells.slice(2).map(c => {
        const value = num(c.text);
        if (value === undefined) throw new Error('Missing team statistic');
        return value;
      });
      for (let i = 3; i < headers.length; i++) metrics[headers[i]] = values[i - 2];
      return { model: text(model), score: values[0], cost: metrics['Spend (paid)'], link: new URL(link, feed).href, metrics };
    });
  },
};

export default board;
