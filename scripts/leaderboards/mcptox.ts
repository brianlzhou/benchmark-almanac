// MCPTox measures how often a language-model agent fails a tool-poisoning safety evaluation.
// Table 2 reports average attack success as a percentage. Lower is better.
// The paper lists reasoning-enabled and reasoning-disabled runs separately.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2508.14925';
const board: Leaderboard = {
  benchmark: 'mcptox', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  async fetch() {
    const table = flatPaperTables(await paperHtml(url)).map(grid).find(t =>
      t[0][1] === 'LLM Agent' && t[0][2] === 'Reasoning' && t[0].at(-1) === 'Avg.');
    if (!table || table[1][12] !== 'Avg.') throw new Error('Missing aggregate MCPTox scores');
    return checked(table.slice(2).map(row => {
      if (row.length !== 13 || !['●', '○'].includes(row[2])) throw new Error('Unknown MCPTox reasoning setting');
      // The analysis notebook calls the reasoning variant Phi-4-Think without a checkpoint identifier.
      const model = row[1] === 'Phi-4' ? 'Phi-4-Think' : row[1] === 'Gemini-2.5-flash' ? 'Gemini-2.5-flash (snapshot unspecified)' : row[1];
      return { model, setting: row[2] === '●' ? 'Reasoning enabled' : 'Reasoning disabled', score: numberCell(row[12]) };
    }), 20);
  },
};
export default board;
