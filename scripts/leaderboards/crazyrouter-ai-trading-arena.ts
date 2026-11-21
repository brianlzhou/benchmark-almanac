// Crazyrouter ranks simulated cryptocurrency portfolios by cumulative return after trading fees.
// The page embeds the same participant records that populate its initial standings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const feed = "https://crazyrouter.com/experimental";
const board: Leaderboard = {
  benchmark: "crazyrouter-ai-trading-arena",
  stats: {
    dailyReturnPct: { name: 'Daily return', unit: '%', better: 'higher' },
    equityUsd: { name: 'Portfolio equity', unit: 'usd', better: 'higher' },
    cashUsd: { name: 'Cash balance', unit: 'usd' },
  },
  url: "https://crazyrouter.com/experimental",
  feed,
  terms: "The service terms cover the API platform. I found no separate license for leaderboard data. The site's robots.txt permits the public experiment page.",
  async fetch() {
    type Entry = { name: string; equity: number; cash: number; returnPct: number; dayPct: number; history: { slot: string }[] };
    const { participants } = jsonAfter<{ participants: Entry[] }>(nextFlight(await fetchText(feed)), '"initialData":');
    if (participants.length < 12) throw new Error('Missing trading accounts');
    return participants.map(r => {
      if (!r.name || ![r.returnPct, r.dayPct, r.equity, r.cash].every(Number.isFinite)) throw new Error('Invalid portfolio');
      return { model: r.name, score: r.returnPct, date: r.history.at(-1)?.slot.slice(0, 10),
        metrics: { dailyReturnPct: r.dayPct, equityUsd: r.equity, cashUsd: r.cash } };
    });
  },
};
export default board;
