// Bot Analysis Arena ranks simulated trading accounts by their cumulative return since inception.
// Its standings JSON supplies account returns, current models, model changes and trade statistics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://aitradingcompetition.com/data/standings.json";
const board: Leaderboard = {
  benchmark: "bot-analysis-arena",
  url: "https://aitradingcompetition.com/arena.html",
  feed,
  terms: "The publisher licenses the standings under CC BY 4.0 and requests attribution to aitradingcompetition.com. The site's robots.txt allows the standings file.",
  harnesses: 'system',
  aliases: { 'Opus 5.5': 'claude-opus-5-5', 'Sonnet 5.5': 'claude-sonnet-5-5', 'Gemini 3.1': 'gemini-3-1-pro' },
  async fetch() {
    type Account = { id: string; name: string; modelLabel?: string; returnPct: number; equity: number; avgInvestedPct?: number;
      since: string; modelChange?: { previousLabel?: string }; tradeStats?: Record<string, unknown>; returnContext?: { annualizedPct?: number } };
    const data = await fetchJson<{ competitors: Account[]; standingsUpdatedAt: string }>(feed);
    if (data.competitors.length < 18) throw new Error('Incomplete trading roster');
    return data.competitors.map(a => {
      if (!a.id || !a.name || !Number.isFinite(a.returnPct) || !Number.isFinite(a.equity)) throw new Error('Invalid account return');
      const model = a.modelLabel || a.name;
      const metrics: Record<string, number> = { equity: a.equity };
      for (const [k, v] of Object.entries({ ...a.tradeStats, avgInvestedPct: a.avgInvestedPct, annualizedPct: a.returnContext?.annualizedPct })) {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      return { model, score: a.returnPct, harness: a.name, date: data.standingsUpdatedAt.slice(0, 10),
        setting: 'Since ' + a.since, metrics, link: 'https://aitradingcompetition.com/record/' + a.id,
        ...(a.modelChange?.previousLabel ? { models: [model, a.modelChange.previousLabel] } : {}) };
    });
  },
};
export default board;
