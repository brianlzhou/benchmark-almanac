// HumanoidBench tests humanoid control on 31 locomotion and manipulation tasks with task-specific reward scales.
// Table V reports average return and standard deviation at the authors' training budgets.
// Walk is the first task in that table. Its return is the headline because raw rewards use different scales.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2403.10506';
const board: Leaderboard = {
  benchmark: 'humanoidbench', static: 'paper', url: feed, feed,
  headline: 'The paper reports task-specific returns on different scales. The headline shows average return on walk, its first task.',
  terms: 'Paper terms at https://arxiv.org/abs/2403.10506.',
  async fetch() {
    const figures = (await paperHtml(feed)).match(/<figure\b[^>]*class="ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/g) ?? [];
    const figure = figures.find(f => f.includes('Average returns for'));
    const t = figure && flatPaperTables(figure).map(grid)[0];
    if (!t || t[0].join('|') !== '|DreamerV3|TD-MPC2|SAC|Target' || t[1][0] !== 'walk' || t.length !== 32) throw new Error('Missing HumanoidBench average returns');
    board.parts = Object.fromEntries(t.slice(1).map(([task]) => [task, task]));
    return checked(t[0].slice(1, -1).map((model, i) => {
      const metrics: Record<string, number> = {};
      for (const row of t.slice(1)) {
        const [avg, sd] = row[i + 1].split('\\pm').map(s => numberCell(s.trim()));
        if (!Number.isFinite(sd)) throw new Error('Missing standard deviation for ' + row[0]);
        metrics[row[0]] = avg;
        metrics[row[0] + 'Std'] = sd;
      }
      return { model, setting: model === 'TD-MPC2' ? '2 million training steps' : '10 million training steps',
        score: metrics.walk, metrics: { ...metrics, std: metrics.walkStd } };
    }), 3);
  },
};
export default board;
