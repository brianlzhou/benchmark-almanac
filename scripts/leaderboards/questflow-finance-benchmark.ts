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
  stats: {
    partial: { name: 'Partial pass rate', unit: '%', better: 'higher' },
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    meanToolCalls: { name: 'Mean tool calls', unit: 'count' },
    efficiency: { name: 'Efficiency score', unit: 'score', better: 'higher', note: 'Weighted score from 0 to 100 combining log cost per task (70%) and log median latency (30%).' },
  },
  chart: {
    title: 'Strict pass rate vs. efficiency',
    x: { key: 'efficiency', label: 'Efficiency score', unit: 'score', better: 'higher' },
    y: { key: 'score', label: 'Strict pass rate', unit: '%', better: 'higher' },
    note: 'Strict pass rate against efficiency score (70% log cost score and 30% log speed score), matching the Score vs efficiency chart on Questflow.',
  },
  aliases: { 'MiniMax M3.1 Flash (free)': 'minimax-m3-1-flash' },
  async fetch() {
    const html = await fetchText(feed);
    const json = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!json) throw new Error('Missing embedded Questflow board');
    const data = JSON.parse(json).props.pageProps.board;
    if (data.rows.length < 11 || !data.current) throw new Error('Missing official rankings');
    const logScore = (v: number, lo: number, hi: number) => Math.round(100 * Math.min(1, Math.max(0, 1 - Math.log10(Math.max(v, lo) / lo) / Math.log10(hi / lo))) * 10) / 10;
    return data.rows.map((r: Run) => {
      if (!r.displayName || ![r.strictPass, r.costPerTaskUsd, r.medianLatencyMs, r.testTime].every(Number.isFinite) || r.overallCi95?.length !== 2) throw new Error('Incomplete Questflow result');
      const latency = r.medianLatencyMs / 1000;
      const efficiency = Math.round((0.7 * logScore(r.costPerTaskUsd, 0.01, 10) + 0.3 * logScore(latency, 10, 1800)) * 10) / 10;
      const metrics: Record<string, number> = { partial: r.overallPartial, overallCiLow: r.overallCi95[0], overallCiHigh: r.overallCi95[1], latency, meanToolCalls: r.meanToolCalls, efficiency };
      for (const p of r.pillars) if (p.score != null) metrics[p.pillar] = p.score;
      return { model: r.displayName, score: r.strictPass, cost: r.costPerTaskUsd,
        date: new Date(r.testTime).toISOString().slice(0,10), metrics };
    });
  },
};
export default board;
