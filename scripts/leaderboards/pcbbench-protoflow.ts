// PCBBench tests AI-generated printed-circuit-board designs across 120 public tasks.
// The score is the pilot's mean task score, expressed as a percentage across a complete 120-task run.
// This importer reads the publisher's measured pilot JSON and keeps pass count and coverage beside it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://pcbbench.org/data/pilot.json';
const board: Leaderboard = {
  benchmark: 'pcbbench-protoflow',
  url: 'https://pcbbench.org/',
  feed,
  terms: 'ProtoFlow publishes the PCBBench pilot data on its public benchmark site. https://pcbbench.org/',
  stats: {
    passedTasks: { name: 'Passed tasks', unit: 'count' },
    validTasks: { name: 'Valid tasks', unit: 'count' },
  },
  async fetch() {
    const source = await fetchJson(feed) as { models?: Array<Record<string, unknown>> };
    if (!Array.isArray(source.models)) throw new Error('Missing PCBBench pilot models');
    const rows: LeaderboardRow[] = [];
    for (const entry of source.models) {
      if (entry.state !== 'complete' || entry.valid !== 120 || typeof entry.slug !== 'string' || typeof entry.meanScore !== 'number') continue;
      rows.push({
        model: entry.slug,
        score: entry.meanScore * 100,
        setting: 'Complete public pilot, 120 tasks',
        trials: 120,
        metrics: { passedTasks: Number(entry.passed), validTasks: Number(entry.valid) },
      });
    }
    if (rows.length < 2) throw new Error(`Expected at least two complete PCBBench rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
