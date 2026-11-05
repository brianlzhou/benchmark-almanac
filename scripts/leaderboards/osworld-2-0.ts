// OSWorld 2.0. osworld-v2.xlang.ai renders its leaderboard from static/data/leaderboard/official-results.json:
// one row per run with model, reasoning effort, tool setting, step budget, task release, dataset scope
// ("full" or "offline") and binaryAccuracy, the default sort and headline (0 to 100).
//
// The task set has releases (v2026.06.24, v2026.08.08, v2.1) and the same model scores very differently
// across them, so each release is its own benchmark id; the site's "all releases" view mixes them. Only
// the full task set is read (the default; "offline" is a subset). Step budgets other than the default 500
// are kept with the budget in `setting`. Agent rows ("Sai w/ Claude Opus 5") split at " w/ ". The board's
// other metric, "Partial Score" (partialScore, 0 to 100, partial credit per task), is kept as metrics.partial.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { splitAgent } from './osworld-verified.ts';

const FEED = 'https://osworld-v2.xlang.ai/static/data/leaderboard/official-results.json';

interface Result {
  model: string;
  reasoning?: string;
  toolSetting?: string;
  stepBudget?: number;
  releaseVersion?: string;
  taskVersion?: string;
  datasetScope?: string;
  scope?: string;
  binaryAccuracy?: number;
  partialScore?: number | null;
  outputTokensPerTask?: number | null;
  /** Cost of the whole run: the page divides it by the task count, unless costPerTaskUsd is set. */
  estimatedCostUsd?: number | null;
  costPerTaskUsd?: number | null;
  modelType?: string;
}
interface Data {
  defaultResultReleaseVersion?: string;
  defaultResultDatasetScope?: string;
  defaultStepBudget?: number;
  datasetSize?: number;
  results: Result[];
}

export const ALIASES: Record<string, string> = {
  'Kimi 2.6': 'kimi-k2-6',
  MuseSpark: 'muse-spark',
  'MuseSpark 1.2': 'muse-spark-1-2',
  'MuseSpark 1.3': 'muse-spark-1-3',
};

export function makeOsworld2(benchmark: string, release: string): Leaderboard {
  return {
    benchmark,
    url: 'https://osworld-v2.xlang.ai/',
    feed: `${FEED} (releaseVersion ${release}, full set)`,
    terms: 'Static JSON on the OSWorld 2.0 project site; the OSWorld-V2 repository is Apache-2.0.',
    aliases: ALIASES,
    async fetch() {
      const data = await fetchJson<Data>(FEED);
      const budget = data.defaultStepBudget ?? 500;
      const rows: LeaderboardRow[] = [];
      for (const r of data.results) {
        const version = r.releaseVersion ?? r.taskVersion ?? data.defaultResultReleaseVersion;
        const scope = r.datasetScope ?? r.scope ?? data.defaultResultDatasetScope ?? 'full';
        if (version !== release || scope !== 'full' || typeof r.binaryAccuracy !== 'number') continue;
        const { model, harness } = splitAgent(r.model.trim());
        const steps = r.stepBudget && r.stepBudget !== budget ? `${r.stepBudget} steps` : undefined;
        rows.push({
          model,
          score: r.binaryAccuracy,
          setting: [r.reasoning?.toLowerCase(), steps].filter(Boolean).join(', ') || undefined,
          harness: harness ?? (r.toolSetting || undefined),
          cost: r.costPerTaskUsd ?? (typeof r.estimatedCostUsd === 'number' ? r.estimatedCostUsd / (data.datasetSize || 108) : undefined),
          tokens: r.outputTokensPerTask ?? undefined,
          metrics: typeof r.partialScore === 'number' ? { partial: r.partialScore } : undefined,
        });
      }
      return rows;
    },
  };
}

// The first task release, published 2026-06-26.
export default makeOsworld2('osworld-2-0', 'v2026.06.24');
