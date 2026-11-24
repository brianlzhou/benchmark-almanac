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
  stats: {
    capital_usd: { name: 'Starting capital', unit: 'usd' }, final_nav_usd: { name: 'Final net asset value', unit: 'usd', better: 'higher' }, total_return_pct: { name: 'Total return', unit: '%', better: 'higher' }, return_days: { name: 'Return days', unit: 'count' }, realized_pnl_usd: { name: 'Realized profit and loss', unit: 'usd', better: 'higher' }, unrealized_pnl_usd: { name: 'Unrealized profit and loss', unit: 'usd', better: 'higher' }, margin_ratio_pct: { name: 'Margin ratio', unit: '%', better: 'higher' }, max_drawdown_pct: { name: 'Maximum drawdown', unit: '%', better: 'lower' },
  },
  async fetch() {
    const data = await fetchJson<{ leaderboard_rows: Record<string, unknown>[] }>(feed);
    const scored = (data.leaderboard_rows ?? []).filter(row => typeof row.annualized_return_pct === 'number' && Number.isFinite(row.annualized_return_pct));
    if (scored.length < 10) throw new Error('Missing trader standings');
    return scored.map(row => {
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
