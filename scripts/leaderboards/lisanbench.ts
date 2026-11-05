// LisanBench. lisanbench.com loads data/core.json: per model configuration (one entry per reasoning effort)
// the label, run coverage, token counts and cost, and in "aggregated" the scores. The board's default
// metric is Path Length, `sum_chain_avg` (valid word-chain steps summed over the 50 starting words, averaged
// over 3 trials), which is the score. Every effort is read, with the label's parenthesis ("Opus 5.5
// (xhigh)", "Sonnet 4.6 (16k)") as the setting; the page's default "best effort" view shows the highest of
// them. Cost and output tokens per task are the run totals divided by the number of trials. The file's
// OpenRouter-style ids and release dates fix the snapshot behind short labels, which the aliases follow
// ("Deepseek V3" is deepseek/deepseek-chat released 2024-12-26, "Sonnet 3.6" is the October 2024 Claude 3.5
// Sonnet). Stealth names (Polaris Alpha, Horizon Beta, Sherlock Dash Alpha) stay unmatched. Metrics keep
// the half-width of the Path Length 95% interval (sum_chain_avg_ci, the board's error bars) as "ci" and the
// average reasoning tokens per trial (avg_reasoning_tokens) as "reasoningTokens", the x-axis of the board's
// "Reasoning Tokens vs Path Length" chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://lisanbench.com/data/core.json';

interface Data {
  models: { id: string; full?: string; label: string; coverage?: { trials?: number }; output_tokens?: number; estimated_cost_usd?: number }[];
  aggregated: { model: string; sum_chain_avg?: number; sum_chain_avg_ci?: [number, number] | null; avg_reasoning_tokens?: number | null }[];
}

const board: Leaderboard = {
  benchmark: 'lisanbench',
  url: 'https://lisanbench.com/',
  feed: `${FEED} (aggregated.sum_chain_avg, Path Length)`,
  terms: 'Static JSON on lisanbench.com, which has no robots.txt and publishes no terms of use.',
  aliases: {
    'Deepseek V3': 'deepseek-v3',
    'Kimi K2': 'kimi-k2-jul-2025',
    'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
    'Gemini 2.5 Flash Lite': 'gemini-2-5-flash-lite-jun-2025',
    'Gemini Pro 1.5': 'gemini-1-5-pro-feb-2024',
    'Gemini Flash 1.5': 'gemini-1-5-flash-may-2024',
    'Gemini Flash 1.5 8B': 'gemini-1-5-flash-8b',
    'Gemini 2.0 Flash Lite 001': 'gemini-2-0-flash-lite',
    'Haiku 3': 'claude-3-haiku',
    'Haiku 3.5': 'claude-3-5-haiku',
    'Sonnet 3.5': 'claude-3-5-sonnet',
    'Sonnet 3.6': 'claude-3-5-sonnet-october-2024',
    'Sonnet 3.7': 'claude-3-7-sonnet',
    'Opus 3': 'claude-3-opus',
    'Nova Lite V1': 'amazon-nova-lite',
    'Nova Micro V1': 'amazon-nova-micro',
    'Nova Pro V1': 'amazon-nova-pro',
    'Mistral Small 3.2 24B': 'mistral-small-3-2',
    'Mistral Large 2411': 'mistral-large-2-nov-2024',
    'Devstral Small': 'devstral-small-1-0',
    'Qwen3 30B A3B 2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Qwen3 235B A22B 2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3 235B A22B Thinking 2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'Olmo 3 32B': 'olmo-3-32b-think',
    'Ministral 3B 2512': 'ministral-3-3b-instruct',
    'Ministral 8B 2512': 'ministral-3-8b-instruct',
    'Ministral 14B 2512': 'ministral-3-14b',
    'Doubao Seed 2.0 Lite': 'seed-2-0-lite',
    'Doubao Seed 1.8': 'seed-1-8',
    'Grok 4.20 Beta': 'grok-4-20',
  },
  chart: {
    title: 'Reasoning Tokens vs Path Length',
    note: 'Path Length against the average reasoning tokens per trial, on a log scale; runs without reasoning sit at zero.',
    x: { key: 'reasoningTokens', label: 'Average reasoning tokens per trial', unit: 'tokens', better: 'lower', log: true },
    y: { key: 'score', label: 'Path Length', better: 'higher' },
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const byId = new Map(data.models.map((m) => [m.id, m]));
    const rows: LeaderboardRow[] = [];
    for (const a of data.aggregated) {
      const m = byId.get(a.model);
      if (!m || typeof a.sum_chain_avg !== 'number') continue;
      const paren = m.label.match(/\s*\(([^)]*)\)$/);
      const trials = m.coverage?.trials;
      const name = paren ? m.label.slice(0, paren.index).trim() : m.label;
      const metrics: Record<string, number> = {};
      const ci = a.sum_chain_avg_ci;
      if (Array.isArray(ci) && ci.length === 2 && ci.every(Number.isFinite)) metrics.ci = (ci[1] - ci[0]) / 2;
      if (typeof a.avg_reasoning_tokens === 'number' && a.avg_reasoning_tokens >= 0) metrics.reasoningTokens = a.avg_reasoning_tokens;
      rows.push({
        // the instruct and thinking 2507 releases of Qwen3 235B share one label
        model: /qwen3-235b-a22b-thinking-2507/.test(m.full ?? '') ? 'Qwen3 235B A22B Thinking 2507' : name,
        score: a.sum_chain_avg,
        setting: paren?.[1].trim().toLowerCase() || undefined,
        cost: trials && m.estimated_cost_usd ? m.estimated_cost_usd / trials : undefined,
        tokens: trials && m.output_tokens ? m.output_tokens / trials : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
