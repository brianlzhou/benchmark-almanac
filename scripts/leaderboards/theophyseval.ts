// TheoPhysEval tests autonomous agents on 50 research-level theoretical physics problems.
// Table 4 gives passes by track. Tables 1 to 3 supply theme sizes, token usage and run costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2610.16733';
const agents = [
  ['Astra','GPT-6-Astra','Codex'], ['Opus','Opus 5.5','Claude Code CLI'],
  ['Gemini','Gemini 3.8 Flash','Antigravity'], ['DeepSeek','DeepSeek-V4.1-Flash','Codex'], ['GLM','GLM 5.3','Claude Code CLI'],
];
const board: Leaderboard = {
  benchmark: 'theophyseval', url: feed, feed, static: 'paper', costPer: 'run',
  terms: 'The researchers publish the tables under the paper terms at https://arxiv.org/abs/2610.16733.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const grades = tables.find(t => t[0]?.[0] === 'Problem' && t.at(-1)?.[0] === 'Solved');
    const themes = tables.find(t => t[0]?.join('|') === 'Theme|Problems');
    const tokens = tables.find(t => t[1]?.[1] === 'Uncached input' && t[0][1] === 'Realistic');
    const costs = tables.find(t => t[0]?.join('|') === 'Agent|Realistic|Isolated');
    if (grades?.length !== 53 || !themes || !tokens || !costs) throw new Error('TheoPhysEval tables changed');
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    for (const [i, [agent, model, harness]] of agents.entries()) {
      const usage = tokens.find(r => r[0] === agent);
      const price = costs.find(r => r[0] === agent);
      if (!usage || !price) throw new Error('Missing usage for ' + agent);
      for (const [j, track] of ['Realistic', 'Isolated'].entries()) {
        const col = 1 + 2 * i + j;
        if (grades[0][col] !== agent || grades[1][col] !== track[0]) throw new Error('Unexpected grade column');
        const solved = numberCell(grades.at(-1)![col]);
        const base = 1 + 4 * j;
        const metrics: Record<string,number> = {
          solved, inputTokens: (numberCell(usage[base]) + numberCell(usage[base+1])) * 20000,
          outputTokens: numberCell(usage[base+2]) * 20000, totalTokens: numberCell(usage[base+3]) * 20000,
        };
        let offset = 2;
        for (const [k, [theme, count]] of themes.slice(1,-1).entries()) {
          const size = numberCell(count);
          const group = grades.slice(offset,offset+size);
          if (!group.every(r => r[0].includes('A.' + (k+1) + '.'))) throw new Error('Theme order changed');
          board.parts['theme'+k] = theme;
          metrics['theme'+k] = 100 * group.reduce((sum,r) => sum + numberCell(r[col]), 0) / size;
          offset += size;
        }
        // GLM's subscription covers both tracks, so its cost cannot be assigned to either one.
        rows.push({ model, harness, setting: track + (agent === 'Gemini' ? ', high effort' : ', max effort'),
          score: 2 * solved, metrics, cost: agent === 'GLM' ? undefined : numberCell(price[j + 1]) });
      }
    }
    return checked(rows, 10);
  },
};
export default board;
