// Roark ranks voice stacks by its all-industry Roark score. The stack table API supplies the scores and uncertainty intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://benchmarks.roark.ai/benchmarks/api/stacks-table/v1.3/all";

const board: Leaderboard = {
  benchmark: "roark-live-bench-1-3",
  url: "https://benchmarks.roark.ai/benchmarks",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host publishes robots.txt at https://benchmarks.roark.ai/robots.txt.",
  stats: {
    value: { name: 'Value score', unit: 'score', better: 'higher' },
    task: { name: 'Task completion', unit: '%', better: 'higher' },
    tool_use: { name: 'Tool use', unit: '%', better: 'higher' },
    ttfw: { name: 'Time to first word', unit: 'seconds', better: 'lower' },
    lat: { name: 'Response time', unit: 'seconds', better: 'lower' },
    turn: { name: 'Barge-in handling', unit: '%', better: 'higher' },
    budget: { name: 'Turn budget', unit: 'count' },
    cost_task: { name: 'Cost per task', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    type Entry = { stack: number; value: number; interval: [number, number] | null; sample: string };
    type Stack = { key: string; name: string };
    const data = await fetchJson<{ stacks: Stack[]; boards: { metric: string; rows: Entry[] }[] }>(feed);
    const ranked = data.boards.find(b => b.metric === 'performance')?.rows;
    if (!ranked || ranked.length < 929) throw new Error('Incomplete Roark score table');
    const measures = new Map(data.boards.map(b => [b.metric, new Map(b.rows.map(r => [r.stack, r]))]));
    return ranked.map(({ stack, value, interval }) => {
      const entry = data.stacks[stack];
      if (!entry?.name || !Number.isFinite(value)) throw new Error('Missing stack or Roark score');
      const metrics: Record<string, number> = {};
      for (const [name, scores] of measures) {
        const measurement = scores.get(stack);
        if (name !== 'performance' && measurement) metrics[name] = measurement.value;
      }
      const calls = measures.get('task')?.get(stack)?.sample.match(/over (\d+) calls/);
      const row: LeaderboardRow = {
        model: entry.name, score: value, metrics, cost: metrics.cost_task,
        low: interval?.[0], high: interval?.[1], trials: calls ? Number(calls[1]) : undefined,
        link: board.url + '/' + encodeURIComponent(entry.key),
      };
      if (entry.key.startsWith('cascade-')) row.models = entry.name.split(' + ');
      return row;
    });
  },
};
export default board;
