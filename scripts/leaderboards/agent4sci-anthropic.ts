// Agent4Sci measures improvement on 20 scientific benchmarks relative to the authors' reproduced baselines.
// The headline is the published average relative improvement. Tables 2 and 5 give the default and skill-enabled runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2610.28763';
const board: Leaderboard = {
  benchmark: 'agent4sci-anthropic', static: 'paper', url: feed, feed,
  terms: 'The paper uses the arXiv perpetual non-exclusive license. https://arxiv.org/abs/2610.28763',
  async fetch() {
    const data = paperTables(await paperHtml(feed)).map(grid);
    const parts: Record<string, string> = {};
    const rows: LeaderboardRow[] = [];
    for (const skills of [false, true]) {
      const table = data.find(t => t[0][0] === 'Benchmarks' && t[0].includes(skills ? 'Opus + Skills' : 'Gemini 3.1 Pro'));
      if (!table || !table.at(-1)?.[0].includes('Average') || table.length !== 23) throw new Error('Missing benchmark or average rows');
      for (let i = 4; i < table[0].length; i += 2) {
        const label = table[0][i];
        if (skills && !label.includes('+ Skills')) continue;
        if (!table[1][i].includes('Delta') || table[1][i - 1] !== 'Abs.') throw new Error('Missing improvement or absolute score');
        const model = label.startsWith('Codex') ? 'GPT-5.4' : label === 'Opus + Skills' ? 'Claude Opus 4.6' : label;
        const harness = model.startsWith('GPT') ? 'Codex' : model.startsWith('Gemini') ? 'Gemini CLI' : 'Claude Code';
        const metrics: Record<string, number> = {};
        for (const r of table.slice(2, -1)) {
          const key = r[0].replace(/[^a-zA-Z0-9]/g, '');
          if (!/^-?\d+(\.\d+)?$/.test(r[i])) throw new Error('Invalid improvement for ' + r[0]);
          parts[key] = r[0];
          metrics[key] = Number(r[i]);
          if (/^-?\d+(\.\d+)?$/.test(r[i - 1])) metrics[key + 'Absolute'] = Number(r[i - 1]);
        }
        rows.push({ model, harness, metrics, setting: '12 hours, 8 H200 GPUs, ' + (skills ? 'plug-in skills enabled' : 'default'),
          score: Number(table.at(-1)![i]) });
      }
    }
    board.parts = parts;
    return checked(rows, 6);
  },
};
export default board;
