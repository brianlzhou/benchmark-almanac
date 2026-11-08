// Kaggle Game Arena (Kaggle and Google DeepMind), read through Kaggle's documented public leaderboard
// endpoint (kaggle.com/docs/benchmarks), as simpleqa-verified.ts does. The suite board's "Score" task is
// the overall rating across the games (the board's unit, not a percentage); "Matches Played" and
// "Games Covered" are counts and are not kept. Other Kaggle Benchmarks importers use kaggleRows from here.
// Each row also keeps the score's confidence interval from the same feed (a symmetric ± half-width, or an
// uneven one for the game ratings) as its bounds, metrics.ciLow and ciHigh. A board can keep other tasks of
// its own as metrics through kaggleRows's `extra` argument. Kaggle game rows also keep Avg. Tokens/Turn
// and Avg. Cost/Turn as tokensPerTurn and costPerTurn. These are never per-task cost or output tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const kaggleFeed = (owner: string, slug: string) => `https://www.kaggle.com/api/v1/benchmarks/${owner}/${slug}/leaderboard`;
export const KAGGLE_TERMS = "Kaggle's documented public leaderboard download endpoint; Kaggle's terms of use apply.";
const FEED = kaggleFeed('kaggle', 'game-arena');

interface Value {
  value?: number;
  hasConfidenceInterval?: boolean;
  confidenceInterval?: number;
  hasUnevenConfidenceInterval?: boolean;
  unevenConfidenceInterval?: { plus?: number; minus?: number };
}
/** Another task of the board kept as a metric: its name and a factor such as 100 for a fraction. */
export interface KaggleMetric {
  task: string;
  scale?: number;
}
interface Row {
  modelVersionName?: string;
  modelVersionSlug?: string;
  modelVersionConfigName?: string;
  agentName?: string;
  harnessName?: string;
  taskResults: { benchmarkTaskName?: string; result?: { numericResult?: Value; numericResultNullable?: Value; evaluationDate?: string } }[];
}

/** One row per model from a Kaggle Benchmarks leaderboard, scored by the named task ("Score"), times `scale`,
 * with the score's confidence interval and any `extra` tasks as metrics (metrics key -> task). */
export async function kaggleRows(owner: string, slug: string, task = 'Score', scale = 1, extra: Record<string, KaggleMetric> = {}): Promise<LeaderboardRow[]> {
  const { rows } = await fetchJson<{ rows: Row[] }>(kaggleFeed(owner, slug));
  const out: LeaderboardRow[] = [];
  for (const r of rows) {
    const res = r.taskResults.find((t) => t.benchmarkTaskName === task)?.result;
    const num = res?.numericResultNullable ?? res?.numericResult;
    const value = num?.value;
    if (value == null) continue;
    const metrics: Record<string, number> = {};
    const uneven = num?.hasUnevenConfidenceInterval ? num.unevenConfidenceInterval : undefined;
    if (uneven?.plus != null && uneven.minus != null && (uneven.plus || uneven.minus)) {
      metrics.ciLow = (value - uneven.minus) * scale;
      metrics.ciHigh = (value + uneven.plus) * scale;
    } else if (num?.hasConfidenceInterval && num.confidenceInterval) {
      metrics.ciLow = (value - num.confidenceInterval) * scale;
      metrics.ciHigh = (value + num.confidenceInterval) * scale;
    }
    const perTurn: Record<string, KaggleMetric> = owner === 'kaggle' && task === 'Score' ? {
      tokensPerTurn: { task: 'Avg. Tokens/Turn' },
      costPerTurn: { task: 'Avg. Cost/Turn' },
    } : {};
    for (const [k, m] of Object.entries({ ...perTurn, ...extra })) {
      const x = r.taskResults.find((t) => t.benchmarkTaskName === m.task)?.result;
      const v = x?.numericResultNullable?.value ?? x?.numericResult?.value;
      if (v != null) metrics[k] = v * (m.scale ?? 1);
    }
    out.push({
      model: r.modelVersionName?.trim() || r.modelVersionSlug || '',
      score: value * scale,
      setting: r.modelVersionConfigName || undefined,
      harness: [r.agentName, r.harnessName].filter(Boolean).join(', ') || undefined,
      date: res?.evaluationDate?.slice(0, 10),
      ...(Object.keys(metrics).length ? { metrics } : {}),
    });
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena',
  url: 'https://www.kaggle.com/benchmarks/kaggle/game-arena',
  feed: FEED,
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'game-arena'),
};
export default board;
