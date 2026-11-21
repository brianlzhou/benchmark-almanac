// AAArena tests agents that write programs for twelve adversarial games. Table 2 counts
// gold medals, one per game in which the median rank is first. Table 9 reports token use.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2610.12341';
const board: Leaderboard = {
  benchmark: 'aaarena', static: 'paper', url: feed, feed,
  terms: 'The authors publish Tables 2 and 9 on arXiv. https://arxiv.org/abs/2610.12341',
  parts: {}, aliases: {'Opus5.5': 'claude-opus-5-5', 'GPT6-sol': 'gpt-6-sol'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t.at(-1)?.[0].startsWith('Gold medals'));
    const usage = tables.find(t => t[0][0] === 'Game' && t[0][1] === 'Opus5.5' && t.at(-1)?.[0] === 'Total');
    if (!main || !usage || main[2][3] !== 'Elo' || main[2][4] !== 'Rank') throw new Error('Missing main results or token table');
    const games = main.slice(3,-1);
    if (games.length !== 12) throw new Error('Missing game');
    const rows = usage[0].slice(1).map((model,i) => {
      const column = main[1].indexOf(model);
      if (column < 3) throw new Error('Model absent from main table: ' + model);
      const metrics: Record<string,number> = {benchmarkTokens: numberCell(usage.at(-1)![i+1]) * 1e6};
      for (const cells of games) {
        const key = cells[0];
        board.parts![key] = {name: key, unit: 'elo'};
        metrics[key] = numberCell(cells[column]);
        metrics[key + 'Rank'] = numberCell(cells[column+1]);
      }
      return {model, harness: model === 'Opus5.5' ? 'Claude Code' : 'Codex', setting: 'Max reasoning, 128 small and 16 full evaluations',
        trials: 3, score: numberCell(main.at(-1)![column]), metrics};
    });
    return checked(rows,7);
  },
};
export default board;
