// DecBench ranks decompilers by the percentage of functions that satisfy at least one correctness measure. The sample table reads normalized counts from aggregates.json.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://decbench.com/data/aggregates.json";

const board: Leaderboard = {
  benchmark: "decbench",
  url: "https://decbench.com/leaderboard/?dataset=sample-set&norm=1",
  feed,
  terms: "The dataset card lists BSD-2-Clause. The scoreboard gives no separate reuse license. https://huggingface.co/datasets/noelo-lab/decbench-dataset The site publishes crawler content signals in robots.txt.",
  parts: { ged: 'Structural Correctness (GED)', type_match: 'Type Correctness', byte_match: 'Recompilation Bytematch' },
  async fetch() {
    type Counts = [number, number];
    const data = await fetchJson<{
      combos: Record<string, { overall: Record<string, Counts>; per_metric: Record<string, Record<string, Counts>> }>;
      cost: Record<string, { dollars?: { model?: string; per_function: number }; time?: { mean_s: number } }>;
      decompiler_registry: Record<string, { display_name: string; url: string }>;
      decompiler_presets: Record<string, string[]>;
    }>(feed);
    const sample = data.combos['sample-set|1'];
    const percent = ([passed, total]: Counts) => {
      if (!Number.isInteger(passed) || !(total > 0) || passed > total) throw new Error('Invalid DecBench counts');
      return 100 * passed / total;
    };
    const rows: LeaderboardRow[] = [];
    for (const [key, counts] of Object.entries(sample.overall)) {
      const usage = data.cost[key];
      if (!usage?.dollars?.model || (data.decompiler_presets[key] && !data.decompiler_presets[key].includes('sample-set'))) continue;
      const entry = data.decompiler_registry[key];
      const metrics: Record<string, number> = {};
      for (const metric of Object.keys(board.parts!)) metrics[metric] = percent(sample.per_metric[key][metric]);
      if (usage.time) metrics.latency = usage.time.mean_s;
      rows.push({ model: usage.dollars.model, harness: entry.display_name, link: entry.url, score: percent(counts), cost: usage.dollars.per_function, metrics });
    }
    if (rows.length < 2) throw new Error('Missing model-based decompiler results');
    return rows;
  },
};

export default board;
