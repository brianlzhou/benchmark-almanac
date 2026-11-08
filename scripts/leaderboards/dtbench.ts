// DTBench (decision theory in Newcomb-like problems), one part of the Conceptual Reasoning Index.
// conceptualreasoning.ai renders raw accuracy from dtbench_accuracy (0 to 1). The headline is that value
// times 100. The rescaled dtbench score and its dtbench_ci half-width remain secondary metrics.
// No raw-accuracy interval is published, so the rescaled interval is not attached to the accuracy headline.
// As in conceptual-reasoning-index.ts, effort variants (rows whose name differs from base_model)
// appear on charts. DTBench keeps them with base_model as the model and effort as the setting.
// Other columns keep canonical rows unless they opt in. Reka is left
// out as the page does. The cost per task is dt_cost, the average DTBench cost per response that the page's
// DTBench cost chart plots.
// accord-conceptual-consistency.ts reads the concord column through criColumn.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const CRI_FEED = 'https://conceptualreasoning.ai/data/cri-scores.csv';
/** Spellings in cri-scores.csv the shared resolver cannot place (the first group as in conceptual-reasoning-index.ts). */
export const CRI_ALIASES: Record<string, string> = {
  Hy3: 'tencent-hy3',
  'Qwen3.5-Plus': 'qwen-3-5-plus-hosted-397b-a17b',
  'Qwen3.5-Flash': 'qwen-3-5-flash-hosted-35b-a3b',
  'Qwen3 30B-A3B Thinking (2507)': 'qwen3-30b-a3b-thinking-jul-2025',
  'Qwen3 30B-A3B Instruct (2507)': 'qwen3-30b-a3b-instruct-jul-2025',
  'Qwen3-Next 80B-A3B Instruct': 'qwen3-next-80b-a3b',
  'Command A': 'cohere-command-a',
  "Command R+ (Aug '24)": 'command-r-plus',
  "Command R (Aug '24)": 'c4ai-command-r-08-2024',
  'DeepSeek Chat V3 (0324)': 'deepseek-v3-mar-2025',
  // DeepSeek's chat endpoint: V3.1 in non-thinking mode (criColumn adds the setting)
  'DeepSeek Chat V3.1': 'deepseek-v3-1',
  "Mistral Small (Mar '26)": 'mistral-small-4',
  // dated display names: the month says which snapshot ran
  "Claude 3.5 Sonnet (Oct '24)": 'claude-3-5-sonnet-october-2024',
  "Claude 3.5 Sonnet (Jun '24)": 'claude-3-5-sonnet',
  "Mistral Large 2 (Jul '24)": 'mistral-large-2-jul-2024',
  "Mistral Large (Nov '24)": 'mistral-large-2-nov-2024',
  "Mistral Medium 3 (May '25)": 'mistral-medium-3',
  "Mistral Medium (Aug '25)": 'mistral-medium-3-1',
  "Magistral Small (Sep '25)": 'magistral-small-1-2',
  "Mistral Small 3.2 (Jun '25)": 'mistral-small-3-2',
  // the only Muse Glimmer in the registry
  'Muse Glimmer 30B': 'muse-glimmer',
};

export const CRI_TERMS = 'Static CSV the conceptualreasoning.ai page loads; robots.txt allows all paths and the site states no terms or license.';

/**
 * One sub-index column of cri-scores.csv, canonical rows only. `extra` optionally names the column's 95%
 * half-width column (`ci`, kept as metrics.ciLow and ciHigh) and its cost-per-response column (`cost`).
 */
export async function criColumn(column: string, extra: { ci?: string; cost?: string; includeEfforts?: boolean; scale?: number; metrics?: Record<string, string> } = {}): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const r of parseCsv(await fetchText(CRI_FEED))) {
    if (!r.model || r.company === 'Reka') continue;
    if (!extra.includeEfforts && r.base_model && r.model !== r.base_model) continue;
    const v = r[column]?.trim();
    if (!v || !Number.isFinite(Number(v))) continue;
    const score = Number(v) * (extra.scale ?? 1);
    const half = extra.ci ? Number(r[extra.ci]) : NaN;
    const cost = extra.cost ? Number(r[extra.cost]) : NaN;
    const metrics: Record<string, number> = {};
    if (extra.ci && r[extra.ci]?.trim() && half > 0) Object.assign(metrics, { ciLow: score - half, ciHigh: score + half });
    for (const [name, field] of Object.entries(extra.metrics ?? {})) {
      if (r[field]?.trim() && Number.isFinite(Number(r[field]))) metrics[name] = Number(r[field]);
    }
    rows.push({
      model: (extra.includeEfforts && r.base_model ? r.base_model : r.model).trim(),
      score,
      ...(extra.cost && r[extra.cost]?.trim() && Number.isFinite(cost) ? { cost } : {}),
      ...(Object.keys(metrics).length ? { metrics } : {}),
      setting: r.effort || (/^DeepSeek Chat V3\.1$/.test(r.model.trim()) ? 'non-thinking' : undefined),
      date: /^\d{4}-\d\d-\d\d$/.test(r.release_date ?? '') ? r.release_date : undefined,
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'dtbench',
  url: 'https://conceptualreasoning.ai/dtbench',
  feed: `${CRI_FEED} (100 * dtbench_accuracy)`,
  terms: CRI_TERMS,
  aliases: CRI_ALIASES,
  fetch: () => criColumn('dtbench_accuracy', { scale: 100, cost: 'dt_cost', includeEfforts: true, metrics: { dtbench: 'dtbench', dtbenchCi: 'dtbench_ci' } }),
};
export default board;
