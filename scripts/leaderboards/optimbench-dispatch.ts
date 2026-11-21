// OptimBench Dispatch tests constrained vehicle routing and dispatch under disruptions.
// The headline is the deterministic medium-suite reward, which combines task and robustness scores.
// This importer reads the authors' README comparison table and skips hand-written and random baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/yferc/optimbench/main/README.md';
const board: Leaderboard = {
  benchmark: 'optimbench-dispatch',
  url: 'https://github.com/yferc/optimbench',
  feed: FEED,
  terms: 'The authors publish the README and benchmark code publicly. Cite the repository and follow its license. https://github.com/yferc/optimbench',
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const section = source.match(/\| agent\s+\| kind\s+\| reward\s+\| per-seed spread\s+\|([\s\S]*?)\n\nThe spread/)?.[1];
    if (!section) throw new Error('OptimBench result table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.trim().split('\n')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      if (cells.length !== 4 || cells[0].startsWith('-')) continue;
      const [model, kind, reward, spread] = cells;
      if (['hand-written', 'baseline', 'trained'].includes(kind)) continue;
      const score = Number(reward.replaceAll('*', ''));
      const interval = spread.match(/([\d.]+)\s*-\s*([\d.]+)/);
      if (!model || !Number.isFinite(score)) throw new Error('Invalid OptimBench result row');
      rows.push({ model, setting: kind, score, ...(interval ? { low: Number(interval[1]), high: Number(interval[2]) } : {}) });
    }
    return checked(rows, 5);
  },
};
export default board;
