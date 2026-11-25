// SPaRC tests whether a model can return a complete path through a puzzle. The leaderboard JSON gives accuracy on all 500 test puzzles.
// Only full single-shot evaluations measure the cataloged task. The site also hosts interactive Spatial-Gym runs.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/lkaesberg/SPaRC/main/leaderboard/results.json';
type Entry = {
  model: string; type: string; setting: string; n: number; date: string; accuracy_all: number;
  accuracy_by_level: Record<string, number>; invalid_path_rate?: number; avg_steps?: number;
  inspect_task?: string; reference?: string; reasoning_effort?: string; max_tokens?: number;
};
const board: Leaderboard = {
  benchmark: 'spatial-pathfinding-reasoning-challenge', url: 'https://sparc.gipplab.org/#leaderboard', feed,
  terms: 'The project uses MIT. https://github.com/lkaesberg/SPaRC/blob/main/LICENSE',
  stats: { invalidPathRate: {name: 'Invalid path rate', unit: '%', better: 'lower'}, steps: {name: 'Average steps', unit: 'count'} },
  aliases: { 'Mistral Small 3.2 24B': 'mistral-small-3-2', 'R1 Distill 32B': 'deepseek-r1-distill-qwen-32b', 'R1 70B': 'deepseek-r1-distill-llama-70b' },
  parts: Object.fromEntries([1, 2, 3, 4, 5].map(n => ['level' + n, 'Level ' + n])),
  async fetch() {
    const entries = await fetchJson<Entry[]>(feed);
    const rows = entries.filter(r => r.type !== 'human' && r.n === 500 && r.setting === 'single-shot').map(r => {
      const metrics: Record<string, number> = {};
      for (const n of [1, 2, 3, 4, 5]) {
        const value = r.accuracy_by_level[n];
        if (!Number.isFinite(value)) throw new Error('Missing SPaRC level ' + n);
        metrics['level' + n] = value;
      }
      if (r.invalid_path_rate != null) metrics.invalidPathRate = r.invalid_path_rate;
      if (r.avg_steps != null) metrics.steps = r.avg_steps;
      const harness = r.inspect_task ?? r.reference?.split(' (')[0];
      return { model: r.model, score: r.accuracy_all, setting: [r.setting, r.reasoning_effort].filter(Boolean).join(', '), harness, date: r.date, metrics };
    });
    return checked(rows, 27);
  },
};
export default board;
