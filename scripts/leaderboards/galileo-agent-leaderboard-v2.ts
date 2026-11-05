// Galileo Agent Leaderboard v2. The galileo-ai/agent-leaderboard Space opens on its v2 tab, built from
// results_v2.csv in the Space repository and sorted by "Avg AC" (Action Completion: the share of simulated
// customer-support goals an agent completes across five industries, 0 to 1). Avg AC times 100 is the score.
// "Avg Total Cost" is the mean cost in US dollars of one conversation and is kept as the cost. Model names
// are API ids, whose date stamps pick the snapshot. galileo-agent-leaderboard.ts reads the v1 tab.
// Metrics: "Avg TSQ" (tool selection quality, 0 to 100) as `tsq`, "Avg Session Duration" (seconds per
// conversation) as `latency` and "Avg Turns" as `turns`. The tab's "Speed vs Accuracy Trade-off" chart plots
// session duration against Action Completion.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const GALILEO_URL = 'https://huggingface.co/spaces/galileo-ai/agent-leaderboard';
export const galileoFeed = (file: string) => `https://huggingface.co/spaces/galileo-ai/agent-leaderboard/resolve/main/${file}`;
export const GALILEO_TERMS = 'CSV in the galileo-ai/agent-leaderboard Hugging Face Space, licensed Apache-2.0.';

/** A date stamp at the end of an API model id ("gpt-4.1-2025-04-14", "claude-3-7-sonnet-20250219"). */
export const stampDate = (name: string) => {
  const m = name.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
};

/** Galileo's API ids that the shared resolver cannot place, shared by both tabs. */
export const GALILEO_ALIASES: Record<string, string> = {
  'gemini-2.5-pro-preview-03-25': 'gemini-2-5-pro-mar-2025',
  'gemini-2.5-pro-preview-05-06': 'gemini-2-5-pro-may-2025',
  'gemini-2.5-flash-preview-04-17': 'gemini-2-5-flash-apr-2025',
  'gemini-2.5-flash-preview-05-20': 'gemini-2-5-flash-may-2025',
  'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
  'mistral-medium-2508': 'mistral-medium-3-1',
  // the stable releases (the boards name previews by their dated ids)
  'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
  'gemini-2.5-flash-lite': 'gemini-2-5-flash-lite-jun-2025',
  'gemini-2.0-flash-lite-001': 'gemini-2-0-flash-lite',
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
  'grok-4-0709': 'grok-4',
  // the July 2025 release (the September update is named Kimi-K2-Instruct-0905)
  'kimi-k2-instruct': 'kimi-k2-jul-2025',
  'qwen3-235b-a22b-instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
  'amazon.nova-pro-v1': 'amazon-nova-pro',
  'amazon.nova-lite-v1': 'amazon-nova-lite',
  'amazon.nova-micro-v1': 'amazon-nova-micro',
  'nova-pro-v1': 'amazon-nova-pro',
  'nova-lite-v1': 'amazon-nova-lite',
  'mistral-large-2411': 'mistral-large-2-nov-2024',
  'mistral-small-2506': 'mistral-small-3-2',
  'mistral-small-2503': 'mistral-small-3-1',
  'mistral-small-2409': 'mistral-small-v24-09',
  'magistral-small-2506': 'magistral-small-1-0',
  'ministral-8b-2410': 'ministral-8b',
  'open-mistral-nemo-2407': 'mistral-nemo',
  'Llama-4-Maverick-17B-128E-Instruct-FP8': 'llama-4-maverick',
  'Llama-4-Scout-17B-16E-Instruct': 'llama-4-scout',
};

const board: Leaderboard = {
  benchmark: 'galileo-agent-leaderboard-v2',
  url: GALILEO_URL,
  feed: `${galileoFeed('results_v2.csv')} (Avg AC)`,
  terms: GALILEO_TERMS,
  aliases: GALILEO_ALIASES,
  chart: {
    title: 'Speed vs Accuracy Trade-off',
    note: 'Average session duration of one conversation against Action Completion.',
    x: { key: 'score', label: 'Action Completion', unit: '%', better: 'higher' },
    y: { key: 'latency', label: 'Avg session duration', unit: 's', better: 'lower' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(galileoFeed('results_v2.csv')))) {
      const score = Number(r['Avg AC']);
      if (!r.Model || !Number.isFinite(score)) continue;
      const cost = Number(r['Avg Total Cost']);
      const metrics: Record<string, number> = {};
      const put = (key: string, col: string, scale = 1) => {
        const v = r[col]?.trim() ? Number(r[col]) : NaN;
        if (Number.isFinite(v)) metrics[key] = v * scale;
      };
      put('tsq', 'Avg TSQ', 100);
      put('latency', 'Avg Session Duration');
      put('turns', 'Avg Turns');
      rows.push({
        model: r.Model.trim(),
        score: score * 100,
        cost: Number.isFinite(cost) ? cost : undefined,
        date: stampDate(r.Model.trim()),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
