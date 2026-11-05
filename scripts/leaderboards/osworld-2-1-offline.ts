// OSWorld 2.1, offline subset: the 82 tasks of task release v2.1 that need no internet access. The site
// keeps these runs in the same official-results.json as the full set, marked datasetScope "offline", and
// the scores do not compare with the full 108-task set (osworld-2-1.ts). binaryAccuracy (0 to 100) is the
// headline, as on the full board. Step budgets other than the default 500 go into `setting`, and agent
// rows ("Sai w/ Claude Opus 5") split at " w/ ". The full-set reader is makeOsworld2 in osworld-2-0.ts,
// which reads only the full set, so this file repeats its loop for the offline scope.
// partialScore, the board's partial-credit score (0 to 100), is kept as metrics.partial.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { splitAgent } from './osworld-verified.ts';
import { ALIASES } from './osworld-2-0.ts';

const FEED = 'https://osworld-v2.xlang.ai/static/data/leaderboard/official-results.json';
const RELEASE = 'v2.1';
const SCOPE = 'offline';
const OFFLINE_TASKS = 82;

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
  estimatedCostUsd?: number | null;
  costPerTaskUsd?: number | null;
}

const board: Leaderboard = {
  benchmark: 'osworld-2-1-offline',
  url: 'https://osworld-v2.xlang.ai/',
  feed: `${FEED} (releaseVersion ${RELEASE}, ${SCOPE} set)`,
  terms: 'Static JSON on the OSWorld 2.0 project site; the OSWorld-V2 repository is Apache-2.0.',
  aliases: ALIASES,
  async fetch() {
    const data = await fetchJson<{ defaultResultReleaseVersion?: string; defaultStepBudget?: number; results: Result[] }>(FEED);
    const budget = data.defaultStepBudget ?? 500;
    const rows: LeaderboardRow[] = [];
    for (const r of data.results) {
      const version = r.releaseVersion ?? r.taskVersion ?? data.defaultResultReleaseVersion;
      const scope = r.datasetScope ?? r.scope;
      if (version !== RELEASE || scope !== SCOPE || typeof r.binaryAccuracy !== 'number') continue;
      const { model, harness } = splitAgent(r.model.trim());
      const steps = r.stepBudget && r.stepBudget !== budget ? `${r.stepBudget} steps` : undefined;
      rows.push({
        model,
        score: r.binaryAccuracy,
        setting: [r.reasoning?.toLowerCase(), steps].filter(Boolean).join(', ') || undefined,
        harness: harness ?? (r.toolSetting || undefined),
        cost: r.costPerTaskUsd ?? (typeof r.estimatedCostUsd === 'number' ? r.estimatedCostUsd / OFFLINE_TASKS : undefined),
        tokens: r.outputTokensPerTask ?? undefined,
        metrics: typeof r.partialScore === 'number' ? { partial: r.partialScore } : undefined,
      });
    }
    return rows;
  },
};
export default board;
