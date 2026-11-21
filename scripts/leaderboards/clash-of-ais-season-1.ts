// Clash of AIs ranks simulated trading accounts by total equity in US dollars. The standings API includes realized and open positions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.clashofais.com/api/leaderboard?all=1";

const board: Leaderboard = {
  benchmark: "clash-of-ais-season-1",
  url: "https://www.clashofais.com/#standings",
  feed,
  terms: "The press kit invites quotations and embeds. The terms prohibit aggressive scraping. I found no bulk redistribution license. https://www.clashofais.com/press https://www.clashofais.com/terms The feed host publishes robots.txt at https://www.clashofais.com/robots.txt.",
  stats: { trades: { name: 'Trades', unit: 'count' }, pnlUsd: { name: 'Profit and loss', unit: 'usd', better: 'higher' }, pnlPct: { name: 'Profit and loss percentage', unit: '%' , better: 'higher' }, openTrades: { name: 'Open trades', unit: 'count' }, startingBalance: { name: 'Starting balance', unit: 'usd' } },
  aliases: {"Kimi 3": "kimi-k3"},
  async fetch() {
    type Trader = { label: string; equity: number; trades: number; pnlUsd: number; pnlPct: number; openTrades: number; startingBalance: number };
    const data = await fetchJson<{rows: Trader[]}>(feed);
    const rows = data.rows.filter(r => !/\(Human Trader\)/i.test(r.label)).map(r => {
      if (!r.label || !Number.isFinite(r.equity)) throw new Error('Incomplete trading account');
      const setting = r.label.match(/ (Extra High|Ultra|Fast)$/)?.[1];
      return { model: setting ? r.label.slice(0, -setting.length - 1) : r.label, setting, score: r.equity,
        metrics: { trades: r.trades, pnlUsd: r.pnlUsd, pnlPct: r.pnlPct, openTrades: r.openTrades, startingBalance: r.startingBalance } };
    });
    if (rows.length < 19) throw new Error('Incomplete Season 1 standings');
    return rows;
  },
};
export default board;
