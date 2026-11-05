// WeirdML v3: the page's summary table and plot load assets/data/weirdml_v3.json. Each model entry has
// "score", the average score across the 11 tasks (0 to 1, shown with three decimals), its coding agent
// ("codex_cli", "claude_code", ...) and its reasoning effort. Its 95% "interval" for the score is kept as
// metrics.ciLow and metrics.ciHigh (0 to 100).
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://htihle.github.io/assets/data/weirdml_v3.json';

interface Model {
  id: string;
  name: string;
  agent?: string;
  release_date?: string;
  reasoning_effort?: string;
  synthetic?: boolean;
  score: number;
  /** The 95% interval of the score, 0 to 1. */
  interval?: [number, number] | null;
  /** Mean API cost and output tokens for one run of one task. */
  mean_api_cost_usd?: number | null;
  mean_output_tokens?: number | null;
}

const board: Leaderboard = {
  benchmark: 'weirdml-v3',
  url: 'https://htihle.github.io/weirdml.html',
  feed: FEED,
  terms: "Data file of the author's public GitHub Pages site, which states no license or terms.",
  aliases: {},
  async fetch() {
    const { models } = await fetchJson<{ models: Model[] }>(FEED);
    return models
      .filter((m) => !m.synthetic && Number.isFinite(m.score))
      .map((m) => {
        // "Inkling (xhigh, Together)": effort, then the inference provider when there is one
        const paren = m.name.match(/\s*\(([^()]*)\)\s*$/);
        const parts = paren ? paren[1].split(',').map((s) => s.trim()) : [];
        const provider = parts.slice(1).join(', ');
        const ci = Array.isArray(m.interval) && m.interval.every(Number.isFinite) ? m.interval : undefined;
        return {
          model: paren ? m.name.slice(0, paren.index).trim() : m.name,
          score: m.score * 100,
          setting: m.reasoning_effort ?? parts[0],
          harness: [m.agent, provider && `via ${provider}`].filter(Boolean).join(' ') || undefined,
          date: m.release_date,
          cost: m.mean_api_cost_usd ?? undefined,
          tokens: m.mean_output_tokens ?? undefined,
          metrics: ci ? { ciLow: ci[0] * 100, ciHigh: ci[1] * 100 } : undefined,
        };
      });
  },
};
export default board;
