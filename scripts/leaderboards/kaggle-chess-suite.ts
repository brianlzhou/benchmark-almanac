// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Kaggle Chess Suite rates text-input chess with and without preset openings. Each track has its own uncertainty interval.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { kaggleFeed } from './kaggle-game-arena.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = kaggleFeed('kaggle', 'chess-suite');
type Rating = { value: number; hasUnevenConfidenceInterval: boolean; unevenConfidenceInterval?: { plus: number; minus: number };
  hasConfidenceInterval: boolean; confidenceInterval: number };
type Entry = { modelVersionName: string; modelVersionConfigName?: string; taskResults: { benchmarkTaskName: string;
  result: { numericResult?: Rating; evaluationDate?: string } }[] };
const parts = { text: 'Text Input', openings: 'Text Input With Openings' };
const board: Leaderboard = {
  benchmark: 'kaggle-chess-suite', url: 'https://www.kaggle.com/benchmarks/kaggle/chess-suite', feed, parts,
  terms: 'Kaggle publishes these chess ratings under its terms of use. https://www.kaggle.com/terms',
  async fetch() {
    const { rows: entries } = await fetchJson<{rows: Entry[]}>(feed);
    const rows: LeaderboardRow[] = [];
    for (const entry of entries) {
      const metrics: Record<string, number> = {};
      for (const [key, name] of Object.entries(parts)) {
        const task = entry.taskResults.find(t => t.benchmarkTaskName === name);
        if (!task) throw new Error('Missing Kaggle chess track ' + name);
        const rating = task.result.numericResult;
        if (!rating) continue;
        if (!Number.isFinite(rating.value)) throw new Error('Invalid rating for ' + entry.modelVersionName);
        metrics[key] = rating.value;
        const ci = rating.hasUnevenConfidenceInterval ? rating.unevenConfidenceInterval :
          rating.hasConfidenceInterval ? { plus: rating.confidenceInterval, minus: rating.confidenceInterval } : undefined;
        if (ci) {
          metrics[key + 'Low'] = rating.value - ci.minus;
          metrics[key + 'High'] = rating.value + ci.plus;
        }
      }
      if (metrics.text !== undefined && metrics.openings !== undefined) rows.push({
        model: entry.modelVersionName, setting: entry.modelVersionConfigName, score: (metrics.text + metrics.openings) / 2, metrics,
      });
    }
    return checked(rows, 8);
  },
};
export default board;
