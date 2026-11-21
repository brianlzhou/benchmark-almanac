// ASCII Bench rates models from blind votes on text drawings. The leaderboard table gives Bradley-Terry ratings,
// 95% intervals, vote counts and win rates for models that have received votes.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';

const feed = "https://www.asciibench.com/leaderboard";
const board: Leaderboard = {
  benchmark: 'ascii-bench-botterill',
  url: "https://www.asciibench.com/leaderboard",
  feed,
  terms: "The site serves HTML at robots.txt. The about page describes voting and privacy. It gives no reuse license for the drawings or scores. https://www.asciibench.com/about",
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Rank|Model|Score|95% CI|Votes|Win rate');
    if (!table || table.length < 14) throw new Error('Missing rated ASCII Bench models');
    return table.slice(1).map(([, name, rating, interval, votes, wins]) => {
      const anchor = name.html.match(/<a\b[^>]*href="(\/models\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const bounds = interval.html.match(/title="(\d+)–(\d+)"/);
      const score = num(rating.text), count = num(votes.text), winRate = num(wins.text);
      if (!anchor || !bounds || score === undefined || count === undefined || winRate === undefined)
        throw new Error('Incomplete ASCII Bench rating');
      const link = new URL(anchor[1], feed).href;
      const setting = anchor[1].match(/-(high|medium|low)$/)?.[1];
      return { model: text(anchor[2]), setting, link, score, low: Number(bounds[1]), high: Number(bounds[2]),
        metrics: { votes: count, winRate } };
    });
  },
};
export default board;
