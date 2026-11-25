// Razavi-Bench scores analog circuit reasoning as a percentage of available rubric points.
// The dashboard reads the active judge scores and run totals from its Direct QA index.
import type { Leaderboard } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://razavi-bench.tokenzhang.com/data/direct_qa/index.json";
type Tokens = { input_tokens: number; output_tokens: number; cached_input_tokens: number; total_tokens: number };
type Model = { display_name: string; model_key: string; thinking_effort: string; detail_file: string; summary: {
  scores: Record<string, { active: { score_percent: number } }>; by_rollout: Record<string, { score_percent: number }>;
  tokens: { usage_record_count?: number; totals?: Tokens; known_totals?: Tokens }; rollout_count: number;
} };

const board: Leaderboard = {
  benchmark: "razavi-bench",
  url: "https://razavi-bench.tokenzhang.com/",
  feed,
  terms: "The authors allow citation and publication of separately produced aggregate results. Redistributing their published scores requires prior written permission. The host returned no readable robots.txt rules.",
  parts: { part1: 'Part 1', part2: 'Part 2' },
  stats: {
    totalTokens: { name: 'Total tokens', unit: 'tokens', better: 'lower' },
    inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' },
    cachedInputTokens: { name: 'Cached input tokens', unit: 'tokens' },
    outputTokens: { name: 'Output tokens', unit: 'tokens', better: 'lower' },
  },
  costPer: 'run',
  chart: {
    title: 'Overall Active Score vs Resource Usage',
    note: 'Active overall score against total answer model tokens across all 50 tasks and 3 rollouts, matching the default scatter chart on the Razavi-Bench dashboard.',
    x: { key: 'totalTokens', label: 'Total answer model tokens', unit: 'tokens', better: 'lower', log: true },
    y: { key: 'score', label: 'Active score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const { models } = await fetchJson<{ models: Model[] }>(feed);
    const pricing = await fetchText(new URL('/assets/pricing.js', feed).href);
    const prices = jsLiteral<Record<string, number[]>>(pricing, pricing.indexOf('var PRICE=') + 10);
    const excluded = jsLiteral<Record<string, boolean>>(pricing, pricing.indexOf('var NO_API_COST=') + 16);
    if (models.length < 73) throw new Error('Incomplete Direct QA results');
    return models.map(m => {
      const s = m.summary, t = s.tokens.totals ?? s.tokens.known_totals;
      const score = s.scores.overall.active.score_percent;
      const part1 = s.scores.part1.active.score_percent, part2 = s.scores.part2.active.score_percent;
      const runs = Object.values(s.by_rollout).map(r => r.score_percent);
      if (!m.display_name || !runs.length || ![score, part1, part2, ...runs].every(Number.isFinite)) throw new Error('Invalid Direct QA percentages');
      const key = prices[m.model_key] ? m.model_key : Object.keys(prices).find(k => m.model_key.startsWith(k));
      const p = key && !excluded[m.model_key] ? prices[key] : undefined;
      const cached = t?.cached_input_tokens ?? 0;
      const cost = t && p ? Math.round(((t.input_tokens - cached) * p[0] + t.output_tokens * p[1] + cached * p[2]) / 10000) / 100 : undefined;
      const usageCount = s.tokens.usage_record_count;
      const tokens = t && usageCount && usageCount > 0 && t.output_tokens > 0 ? Math.round(t.output_tokens / usageCount) : undefined;
      return { model: m.display_name, setting: m.thinking_effort, score, low: Math.min(...runs), high: Math.max(...runs),
        trials: s.rollout_count, cost, tokens, link: new URL(m.detail_file, feed).href,
        metrics: { part1, part2, ...(t ? { totalTokens: t.total_tokens, inputTokens: t.input_tokens, cachedInputTokens: t.cached_input_tokens, outputTokens: t.output_tokens } : {}) } };
    });
  },
};
export default board;
