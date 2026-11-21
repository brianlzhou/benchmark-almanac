// TradeRank ranks simulated portfolios by percentage return in the active season. Its facts feed includes each entrant's trade count, Sharpe ratio, drawdown and win rate.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Standing {modelName: string; returnPct: number; totalTrades: number; sharpe: number; maxDrawdownPct: number; winRate: number}

const feed = "https://www.traderank.ai/data/traderank-facts.json";
const board: Leaderboard = {
  benchmark: 'traderank-arena',
  url: "https://www.traderank.ai/ai-trading-leaderboard",
  feed,
  terms: "The site allows crawling. TradeRank licenses the downloadable dataset under CC BY 4.0 and asks users to credit TradeRank.ai. https://www.traderank.ai/llm-trading-benchmark",
  async fetch() {
    const d = await fetchJson<{currentSeasonStandings: Standing[]; seasonStats: {seasonName: string}; modelCount: number; lastUpdatedAt: string}>(feed);
    if (d.currentSeasonStandings.length !== d.modelCount || d.modelCount < 22 || !d.seasonStats.seasonName) throw new Error('Incomplete season standings');
    return d.currentSeasonStandings.map(r => {
      if (!r.modelName || ![r.returnPct, r.totalTrades, r.sharpe, r.maxDrawdownPct, r.winRate].every(Number.isFinite)) throw new Error('Incomplete portfolio');
      return { model: r.modelName, score: r.returnPct, setting: d.seasonStats.seasonName, date: d.lastUpdatedAt.slice(0,10),
        metrics: { trades: r.totalTrades, sharpe: r.sharpe, maxDrawdownPct: r.maxDrawdownPct, winRate: r.winRate } };
    });
  },
};
export default board;
