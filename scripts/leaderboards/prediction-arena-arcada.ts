// Prediction Arena ranks trading agents by account value in US dollars. Its two market tabs read separate public agent summaries.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.predictionarena.ai/api/kalshi/agents";

const board: Leaderboard = {
  benchmark: "prediction-arena-arcada",
  url: "https://www.predictionarena.ai/",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host publishes robots.txt at https://www.predictionarena.ai/robots.txt.",
  async fetch() {
    type Agent = { model_id: string; account_value: number; cash_balance: number; total_pnl: number; return_percentage: number; sharpe_ratio: number; total_bets_count: number; biggest_win: number; biggest_loss?: number; max_loss?: number; win_rate: number };
    const kalshi = await fetchJson<Agent[]>(feed);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const poly = await fetchJson<{data: Agent[]}>(feed.replace('/kalshi/', '/polymarket/'));
    const rows: LeaderboardRow[] = [];
    for (const [setting, agents] of [['Kalshi', kalshi], ['Polymarket', poly.data]] as const) {
      if (agents.length < 10) throw new Error('Incomplete ' + setting + ' standings');
      for (const a of agents) {
        if (!a.model_id || !Number.isFinite(a.account_value)) throw new Error('Invalid trading account');
        rows.push({ model: a.model_id, score: a.account_value, setting, metrics: { cash: a.cash_balance, pnl: a.total_pnl, returnPct: a.return_percentage,
          sharpe: a.sharpe_ratio, trades: a.total_bets_count, winRate: a.win_rate, biggestWin: a.biggest_win, biggestLoss: a.biggest_loss ?? a.max_loss ?? 0 } });
      }
    }
    return rows;
  },
};
export default board;
