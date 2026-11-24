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
  parts: {
    board: { name: 'Board', group: 'Suite' },
    datasheet: { name: 'Datasheet', group: 'Suite' },
    debug: { name: 'Debug', group: 'Suite' },
    modify: { name: 'Modify', group: 'Suite' },
    layout: { name: 'Layout', group: 'Suite' },
    library: { name: 'Library', group: 'Suite' },
    reason: { name: 'Reason', group: 'Suite' },
    review: { name: 'Review', group: 'Suite' },
    schematic: { name: 'Schematic', group: 'Suite' },
    select: { name: 'Select', group: 'Suite' },
  },
  stats: {
    passedTasks: { name: 'Passed tasks', unit: 'count', better: 'higher' },
    meanWallSeconds: { name: 'Mean wall time per task', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const source = await fetchJson(feed) as { models?: Array<Record<string, unknown>> };
    if (!Array.isArray(source.models)) throw new Error('Missing PCBBench pilot models');
    const rows: LeaderboardRow[] = [];
    for (const entry of source.models) {
      if (entry.state !== 'complete' || entry.valid !== 120 || typeof entry.slug !== 'string' || typeof entry.meanScore !== 'number') continue;
      const metrics: Record<string, number> = { passedTasks: Number(entry.passed) };
      if (typeof entry.meanWallSeconds === 'number' && Number.isFinite(entry.meanWallSeconds)) metrics.meanWallSeconds = entry.meanWallSeconds;
      const suites = entry.suites as Record<string, { meanScore?: number }> | undefined;
      for (const suite of Object.keys(board.parts!)) {
        const s = suites?.[suite]?.meanScore;
        if (typeof s === 'number' && Number.isFinite(s)) metrics[suite] = s * 100;
      }
      const cost = typeof entry.costPerTaskUsd === 'number' && Number.isFinite(entry.costPerTaskUsd) ? entry.costPerTaskUsd : undefined;
      const date = typeof entry.lastAttemptAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(entry.lastAttemptAt) ? entry.lastAttemptAt.slice(0, 10) : undefined;
      rows.push({
        model: entry.slug,
        score: entry.meanScore * 100,
        setting: 'Complete public pilot, 120 tasks',
        trials: 120,
        cost,
        date,
        metrics,
      });
    }
    if (rows.length < 2) throw new Error(`Expected at least two complete PCBBench rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
