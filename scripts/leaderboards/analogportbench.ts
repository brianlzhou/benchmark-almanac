// AnalogPortBench measures how often chip designs meet the specifications. The project table reports zero-shot results and the share solved in three tries.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://saeidrajabii.github.io/AnalogPortBench/";

const board: Leaderboard = {
  benchmark: "analogportbench",
  url: "https://saeidrajabii.github.io/AnalogPortBench/",
  feed,
  terms: "The makers publish their code and result files in an MIT licensed repository. https://github.com/saeidrajabii/AnalogPortBench/blob/main/LICENSE The feed host publishes robots.txt at https://saeidrajabii.github.io/robots.txt.",
  parts: {"t1g1": "T1 G1", "t1g2": "T1 G2", "t1g3": "T1 G3", "t2g1": "T2 G1", "t2g2": "T2 G2", "t2g3": "T2 G3", "t3g1": "T3 G1", "t3g2": "T3 G2", "t3g3": "T3 G3"},
  async fetch() {
    const source = await fetchText(feed);
    const table = tables(source).find(t => t[0]?.some(c => c.text.includes('Solved in 3 tries')));
    if (!table) throw new Error('Missing main results');
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const cells of grid(table).slice(2)) {
      const [name, effort] = cells;
      if (!['low', 'medium'].includes(effort)) continue;
      if (effort === 'low') model = name;
      if (!model) throw new Error('Missing model');
      const metrics: Record<string, number> = {};
      Object.keys(board.parts!).forEach((key, i) => {
        const rate = num(cells[2 + i]);
        if (rate === undefined) throw new Error('Missing tier and grade score');
        metrics[key] = rate;
      });
      const flagged = cells[11]?.match(/^(\d+)\/(\d+)$/);
      const alarms = cells[12]?.match(/^(\d+)\/(\d+)$/);
      if (!flagged || !alarms) throw new Error('Missing infeasibility counts');
      metrics.flagged = 100 * Number(flagged[1]) / Number(flagged[2]);
      metrics.falseAlarms = 100 * Number(alarms[1]) / Number(alarms[2]);
      const counts = [5, 3, 2, 5, 3, 4, 11, 9, 8];
      // Each displayed percentage rounds an integer count over three samples per task.
      const passes = Object.keys(board.parts!).reduce((sum, key, i) => sum + Math.round(metrics[key] * 3 * counts[i] / 100), 0);
      rows.push({ model, setting: effort + ', zero-shot', trials: 3, score: passes * 100 / 150, metrics });
      if (effort === 'medium') {
        for (const [index, label] of ['Resampling', 'Simulation feedback'].entries()) {
          const score = num(cells[13 + index]);
          if (score === undefined) throw new Error('Missing three-try result');
          rows.push({ model, setting: effort + ', ' + label, trials: 3, score });
        }
      }
    }
    if (rows.length < 24) throw new Error('Incomplete main results');
    return rows;
  },
};
export default board;
