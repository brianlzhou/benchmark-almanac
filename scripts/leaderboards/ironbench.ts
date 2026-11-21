// The ironbench campaign ranks firmware agents by the fraction of tasks solved within two attempts.
// The archive gives one row per model and task group, including the number of attempts and successes.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://cezman.github.io/ironharness/generations/2026-09-10-data.json";
const board: Leaderboard = {
  benchmark: "ironbench",
  stats: { totalDuration: { name: 'Total duration', unit: 'seconds', better: 'lower' }, totalIterations: { name: 'Total iterations', unit: 'count', better: 'lower' } },
  url: "https://cezman.github.io/ironharness/generations/2026-09-10.html",
  feed,
  terms: "The project uses the MIT license. The archived table dates to September 20 and reports the September 10 campaign. The site returned 404 for robots.txt.",
  parts: { control: 'Control', fsm: 'FSM', io: 'IO', protocol: 'Protocol', resilience: 'Resilience' },
  async fetch() {
    type Group = { model: string; task: string; passed: boolean; attempts: number; solved: number; tags: string[]; total_duration: number; total_iterations: number };
    const d = await fetchJson<{ campaign: string; models: string[]; tasks: string[]; groups: Group[] }>(feed);
    if (d.campaign !== '2026-09-10' || d.models.length < 5 || d.tasks.length !== 13) throw new Error('Wrong or incomplete ironbench campaign');
    return d.models.map(model => {
      const groups = d.groups.filter(r => r.model === model);
      if (groups.length !== d.tasks.length || new Set(groups.map(g => g.task)).size !== d.tasks.length) throw new Error('Missing task groups');
      const categories = new Map<string, [number, number]>();
      let duration = 0, iterations = 0;
      for (const g of groups) {
        if (g.attempts !== 2 || typeof g.passed !== 'boolean' || !Number.isFinite(g.solved)) throw new Error('Invalid campaign group');
        duration += g.total_duration;
        iterations += g.total_iterations;
        for (const tag of g.tags) {
          const totals = categories.get(tag) ?? [0, 0]; totals[0] += g.solved; totals[1] += g.attempts; categories.set(tag, totals);
        }
      }
      const metrics = Object.fromEntries([...categories].map(([tag, [solved, attempts]]) => [tag, 100 * solved / attempts]));
      return { model, score: 100 * groups.filter(g => g.passed).length / groups.length, trials: 2, date: d.campaign, metrics: { ...metrics, totalDuration: duration, totalIterations: iterations } };
    });
  },
};
export default board;
