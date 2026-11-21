// MemoryAgentBench tests four long-context memory skills. Table 3 reports the overall score and task scores.
// The authors identify GPT-4o-mini as the default backbone for the retrieval and memory agents.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2507.05257';
const columns = ['SH-QA', 'MH-QA', 'LME(S*)', 'EventQA', 'Avg.', 'MCC', 'Recom.', 'Avg.', 'Summ.', 'DetQA', 'Avg.', 'FC-SH', 'FC-MH', 'Avg.'];
const board: Leaderboard = {
  benchmark: 'memoryagentbench', feed, url: feed, static: 'paper', harnesses: 'system',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.at(-1) === 'Overall' && t[1]?.join('|') === ['Agent Type', ...columns, 'Scores'].join('|'));
    if (!t) throw Error('Missing memory agent comparison');
    const keys = columns.map((col, i) => col === 'Avg.' ? t[0][i + 1] : col);
    board.parts = Object.fromEntries(keys.map(k => [k, k]));
    let group = '';
    const rows: LeaderboardRow[] = [];
    for (const [name, ...cells] of t.slice(2)) {
      if (cells.every(c => c === name)) { group = name; continue; }
      const longContext = group === 'Long-Context Agents';
      const context = name.match(/^(.+) \((\d+[KM])\)$/);
      const model = longContext ? (context?.[1] ?? name) : (name === 'MIRIX (4.1-mini)' ? 'GPT-4.1-mini' : 'GPT-4o-mini');
      if (cells.length !== 15 || cells.some(v => !/^\d+(\.\d+)?$/.test(v))) throw Error('Invalid score for ' + name);
      rows.push({ model, score: Number(cells[14]), setting: context ? context[2] + ' context' : undefined,
        harness: longContext ? undefined : name.replace(' (4.1-mini)', ''),
        metrics: Object.fromEntries(keys.map((k, i) => [k, Number(cells[i])])) });
    }
    return checked(rows, 23);
  },
};
export default board;
