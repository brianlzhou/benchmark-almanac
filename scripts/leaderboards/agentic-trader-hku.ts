// HKU ranks simulated foreign exchange traders by annualized return.
// The public run feed also gives total return, account balances and risk measures.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://trade-agent-aiel-hku.com/public/runs/181/data";
const board: Leaderboard = {
  benchmark: "agentic-trader-hku",
  url: "https://trade-agent-aiel-hku.com/",
  feed,
  terms: "HKU displays a copyright notice. I found no data reuse license on the leaderboard. The site returned 404 for robots.txt.",
  async fetch() {
    const data = await fetchJson<{ leaderboard_rows: Record<string, unknown>[] }>(feed);
    if (data.leaderboard_rows?.length < 11) throw new Error('Missing trader standings');
    return data.leaderboard_rows.map(row => {
      const model = row.agent_name;
      if (typeof model !== 'string' || !model) throw new Error('Missing agent name');
      const metrics: Record<string, number> = {};
      for (const field of ['capital_usd', 'final_nav_usd', 'total_return_pct', 'return_days', 'realized_pnl_usd', 'unrealized_pnl_usd', 'margin_ratio_pct', 'max_drawdown_pct', 'annualized_return_pct']) {
        const value = row[field];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing trader field ' + field);
        metrics[field] = value;
      }
      const { annualized_return_pct: score, ...other } = metrics;
      return { model, score, metrics: other, link: typeof row.agent_href === 'string' ? row.agent_href : undefined };
    });
  },
};
export default board;
