// MCP-SafetyBench measures task completion under adversarial conditions.
// Table 4 gives overall task success, attack success and the same outcomes for five domains.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2512.15163';
const domains = ['Location Navigation', 'Repository Management', 'Financial Analysis', 'Browser Automation', 'Web Searching'];
const parts: Record<string, BoardPart> = {};
for (const name of domains) {
  parts[name + ' TSR'] = { name, group: 'Task success' };
  parts[name + ' ASR'] = { name, group: 'Attack success', better: 'lower' };
}
parts.ASR = { name: 'Overall attack success', group: 'Attack success', better: 'lower' };
const board: Leaderboard = {
  benchmark: 'mcp-safetybench', feed, url: feed, static: 'paper', parts,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'Claude-4.0-Sonnet': 'claude-sonnet-4' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => [...domains, 'Overall'].every((d, i) => t[0]?.[2 * i + 1] === d &&
      t[1]?.[2 * i + 1]?.startsWith('TSR') && t[1]?.[2 * i + 2]?.startsWith('ASR')));
    if (!table) throw Error('Missing Table 4 domain scores');
    const rows = table.slice(2).filter(([name, ...cells]) => !cells.every(cell => cell === name)).map(([model, ...cells]) => {
      if (cells.length !== 12 || cells.some(cell => !/^\d+(\.\d+)?$/.test(cell))) throw Error('Invalid scores for ' + model);
      const metrics: Record<string, number> = { ASR: Number(cells[11]) };
      domains.forEach((name, i) => {
        metrics[name + ' TSR'] = Number(cells[2 * i]);
        metrics[name + ' ASR'] = Number(cells[2 * i + 1]);
      });
      return { model, metrics, score: Number(cells[10]) };
    });
    return checked(rows, 13);
  },
};
export default board;
