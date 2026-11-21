// DevOps-Gym evaluates agents on software development and operations tasks.
// The leaderboard ranks "Avg (average of the four stages)." Its JSON publishes end-to-end success separately.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.devops-gym.com/assets/results/leaderboard.json';
const stages = { build_config: 'Build & Config', monitoring: 'Monitoring', issue_resolving: 'Issue Resolving', test_generation: 'Test Generation' };
type Entry = Record<keyof typeof stages, number> & { model: string; agent: string; end_to_end: number | '--' };
const board: Leaderboard = {
  benchmark: 'devops-gym', url: 'https://www.devops-gym.com/', feed, harnesses: 'system',
  terms: 'DevOps-Gym uses the MIT license at https://github.com/ucsb-mlsec/DevOps-Gym/blob/main/LICENSE.',
  parts: { ...stages, end_to_end: 'End-to-End' },
  aliases: { 'Qwen3-Coder-30B': 'qwen3-coder-30b-a3b-instruct', 'Claude-4-Sonnet': 'claude-sonnet-4' },
  async fetch() {
    const { level1 } = await fetchJson<{ level1: Entry[] }>(feed);
    if (!Array.isArray(level1)) throw new Error('Missing DevOps-Gym results');
    const rows = level1.map(entry => {
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(stages) as (keyof typeof stages)[]) {
        if (!Number.isFinite(entry[key])) throw new Error('Missing stage: ' + key);
        metrics[key] = entry[key];
      }
      const score = Object.values(metrics).reduce((a, b) => a + b, 0) / 4;
      if (typeof entry.end_to_end === 'number') metrics.end_to_end = entry.end_to_end;
      if (!entry.model || !entry.agent) throw new Error('Missing model or agent');
      return { model: entry.model, harness: entry.agent, score, metrics };
    });
    return checked(rows, 9);
  },
};
export default board;
