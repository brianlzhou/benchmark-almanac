// Solana Machine Trading measures autonomous trading bots on published market tasks.
// The headline is the unweighted mean skill across all tasks in the latest published release.
// This importer reads the release JSON committed with the benchmark's results archive.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://github.com/lgalabru/machine-trading';
const feed = 'https://raw.githubusercontent.com/lgalabru/machine-trading/main/bench/results/0.12.0/release.json';
type Release = { scores: { tasks: Record<string, { models: Record<string, { skill: number; reward: number; trials: number }> }> } };
const board: Leaderboard = {
  benchmark: 'solana-machine-trading', url, feed,
  terms: 'The benchmark repository publishes this release file under its MIT license. https://github.com/lgalabru/machine-trading/blob/main/LICENSE',
  async fetch(): Promise<LeaderboardRow[]> {
    const release = await fetchJson<Release>(feed);
    const grouped = new Map<string, { skills: number[]; rewards: number[]; trials: number }>();
    for (const task of Object.values(release.scores.tasks)) {
      for (const [name, value] of Object.entries(task.models)) {
        if (!Number.isFinite(value.skill)) continue;
        const model = name.replace(/\s+·\s+.*$/, '');
        const current = grouped.get(model) ?? { skills: [], rewards: [], trials: value.trials };
        current.skills.push(value.skill);
        current.rewards.push(value.reward);
        grouped.set(model, current);
      }
    }
    const rows = [...grouped].map(([model, value]) => ({ model, score: value.skills.reduce((a, b) => a + b, 0) / value.skills.length, trials: value.trials, metrics: { reward: value.rewards.reduce((a, b) => a + b, 0) / value.rewards.length, tasks: value.skills.length } }));
    if (rows.length < 2 || rows.some((row) => !Number.isFinite(row.score))) throw new Error('Machine Trading release rows missing');
    return rows;
  },
};
export default board;
