// RedstoneBench has models build and test redstone circuits in Minecraft across 16 tasks.
// The headline size score is the mean percentage of the smallest known build reached on each task.
// This importer reads the public site's JSON index and reproduces its per-config leaderboard formula.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://redstone-bench.adamholter.chatgpt.site/';
const FEED = 'https://raw.githubusercontent.com/adamholter/redstone-bench/main/site/data/index.json';
interface Task { id: string; title: string; family: string; known?: [number, string] | null; }
interface Config { id: string; model: string; effort: string; }
interface Run { task: string; config: string; model: string; effort: string; seconds?: number; calls?: number; tokens_out?: number; volume?: number | null; }
interface Index { families: Record<string, string>; tasks: Task[]; configs: Config[]; runs: Run[]; }

const board: Leaderboard = {
  benchmark: 'redstonebench',
  url: PAGE,
  feed: FEED,
  terms: 'The benchmark repository is MIT licensed. The hosted page returned its HTML at robots.txt, so this importer reads the generated JSON index from GitHub.',
  costPer: 'run',
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<Index>(FEED);
    if (!data.tasks?.length || !data.configs?.length || !data.runs?.length) throw new Error('RedstoneBench index is incomplete');
    const floor: Record<string, number | null> = {};
    for (const task of data.tasks) {
      const volumes = [task.known?.[0], ...data.runs.filter((run) => run.task === task.id).map((run) => run.volume)].filter((value): value is number => typeof value === 'number' && value > 0);
      floor[task.id] = volumes.length ? Math.min(...volumes) : null;
    }
    const parts: Record<string, BoardPart> = Object.fromEntries(data.tasks.map((task) => [task.id, { name: task.title, group: data.families[task.family] ?? task.family }]));
    board.parts = parts;
    const rows: LeaderboardRow[] = [];
    for (const config of data.configs) {
      const runs = data.tasks.map((task) => data.runs.find((run) => run.task === task.id && run.config === config.id));
      if (!runs.some(Boolean)) continue;
      const metrics: Record<string, number> = {};
      let solved = 0;
      let seconds = 0;
      let tries = 0;
      let outputTokens = 0;
      for (const [index, task] of data.tasks.entries()) {
        const run = runs[index];
        const floorValue = floor[task.id];
        const ratio = run?.volume && floorValue ? 100 * floorValue / run.volume : 0;
        metrics[task.id] = ratio;
        if (run?.volume) solved++;
        if (run) {
          seconds += run.seconds ?? 0;
          tries += run.calls ?? 0;
          outputTokens += run.tokens_out ?? 0;
        }
      }
      const score = data.tasks.reduce((sum, task) => sum + (metrics[task.id] ?? 0), 0) / data.tasks.length;
      metrics.solved = solved;
      metrics.tasks = data.tasks.length;
      metrics.timePerTask = seconds / runs.filter(Boolean).length;
      metrics.triesPerTask = tries / runs.filter(Boolean).length;
      metrics.outputTokens = outputTokens;
      rows.push({ model: config.model, setting: config.effort, score, metrics });
    }
    if (rows.length < 40) throw new Error(`RedstoneBench: ${rows.length} configurations, expected at least 40`);
    return rows;
  },
};
export default board;
