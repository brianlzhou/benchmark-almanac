// Flex-RSI evaluates models that improve themselves over rounds across computer, vision and robotics tasks.
// The overview averages each model's competition ranks across its completed tasks, including ties.
// Read the published results JSON and keep each hidden-test task score with the model's average rank.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://flex-rsi.github.io/leaderboard.html';
const FEED = 'https://flex-rsi.github.io/data/results.json';
const ON_100 = new Set(['rhae', 'rhae_starter', 'robolab_score', 'robolab_starter', 'score']);
const scale = (key: string) => ON_100.has(key) || ['speedup', 'tasks_run', 'tasks_nonzero', 'avg_steps'].includes(key) || key.startsWith('pts_') ? 1 : 100;

interface TaskRow {
  model: string;
  weights?: 'open' | 'closed';
  test: Record<string, number>;
  start?: number;
  best?: number;
  rounds?: number;
  ended?: string;
  extra?: boolean;
}
interface Task {
  id: string;
  track: string;
  primary: string;
  metrics: { key: string; label: string }[];
  rows: TaskRow[];
}
interface Results { updated: string; tasks: Task[] }

const board: Leaderboard = {
  benchmark: 'flex-rsi',
  url: PAGE,
  feed: FEED,
  terms: 'The Flex-RSI site publishes this JSON without a separate score reuse license. The robots.txt URL returned a GitHub error page. Results are credited to Flex-RSI with a link to the leaderboard.',
  parts: {},
  async fetch() {
    const data = await fetchJson<Results>(FEED);
    if (data.tasks.length < 24) throw new Error('Flex-RSI: missing tasks');
    const models = new Map<string, LeaderboardRow & { metrics: Record<string, number> }>();
    for (const task of data.tasks) {
      const primary = task.metrics.find((m) => m.key === task.primary)?.label ?? task.primary;
      board.parts![task.id] = { name: task.track, group: 'Task', better: 'higher', unit: task.primary === 'speedup' ? 'speedup' : 'score', note: `${primary} on the hidden test split.` };
      const standard = task.rows.filter(row => !row.extra);
      for (const source of standard) {
        const raw = source.test?.[task.primary];
        if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error(`Flex-RSI: missing ${task.primary} for ${task.id} ${source.model}`);
        const row = models.get(source.model) ?? { model: source.model, open: source.weights === 'open',
          score: 0, metrics: { tasks: 0, firstPlaces: 0 } };
        const metrics = row.metrics;
        if (task.id in metrics) throw new Error('Duplicate task for ' + source.model);
        const rank = 1 + standard.filter(other => other.test[task.primary] > raw).length;
        row.score += rank;
        metrics.tasks++;
        metrics.firstPlaces += Number(rank === 1);
        for (const [key, value] of Object.entries(source.test)) {
          if (typeof value === 'number' && Number.isFinite(value)) metrics[key === task.primary ? task.id : `${task.id}.${key}`] = value * scale(key);
        }
        if (typeof source.start === 'number') metrics[task.id + '.start'] = source.start * scale(task.primary);
        if (typeof source.best === 'number') metrics[task.id + '.best'] = source.best * scale(task.primary);
        if (typeof source.rounds === 'number') metrics[task.id + '.rounds'] = source.rounds;
        models.set(source.model, row);
      }
    }
    if (models.size < 18) throw new Error('Flex-RSI: incomplete model overview');
    return Array.from(models.values(), row => ({
      ...row, score: Number((row.score / row.metrics.tasks).toFixed(2)),
      setting: row.metrics.tasks < 5 ? 'Unranked (fewer than five tasks)' : undefined,
    }));
  },
};

export default board;
