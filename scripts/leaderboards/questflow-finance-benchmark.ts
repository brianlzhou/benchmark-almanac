// Questflow ranks financial agents by strict pass rate across all tasks. The page embeds official scores, pillar scores, test times, costs and intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
interface Run {displayName: string; strictPass: number; overallPartial: number; costPerTaskUsd: number; medianLatencyMs: number; meanToolCalls: number; taskCount: number; testTime: number; overallCi95: number[]; pillars: {pillar: string; score: number | null}[]}

const feed = "https://next.questflow.ai/benchmark";
const board: Leaderboard = {
  benchmark: 'questflow-finance-benchmark',
  url: "https://next.questflow.ai/benchmark",
  feed,
  terms: "The site allows crawling. Questflow limits platform use to personal, noncommercial, or qualifying internal business use. I found no separate public data license. https://docs.questflow.ai/terms-of-use",
  parts: { FINANCIAL: 'Financial Analysis', MARKET_SIGNAL: 'Market & Signal' },
  aliases: { 'MiniMax M3.1 Flash (free)': 'minimax-m3-1-flash' },
  async fetch() {
    const html = await fetchText(feed);
    const json = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!json) throw new Error('Missing embedded Questflow board');
    const data = JSON.parse(json).props.pageProps.board;
    if (data.rows.length < 11 || !data.current) throw new Error('Missing official rankings');
    return data.rows.map((r: Run) => {
      if (!r.displayName || ![r.strictPass, r.costPerTaskUsd, r.medianLatencyMs, r.testTime].every(Number.isFinite) || r.overallCi95?.length !== 2) throw new Error('Incomplete Questflow result');
      const metrics: Record<string, number> = { partial: r.overallPartial, overallCiLow: r.overallCi95[0], overallCiHigh: r.overallCi95[1], latency: r.medianLatencyMs / 1000, meanToolCalls: r.meanToolCalls, tasks: r.taskCount };
      for (const p of r.pillars) if (p.score != null) metrics[p.pillar] = p.score;
      return { model: r.displayName, score: r.strictPass, cost: r.costPerTaskUsd,
        date: new Date(r.testTime).toISOString().slice(0,10), metrics };
    });
  },
};
export default board;
