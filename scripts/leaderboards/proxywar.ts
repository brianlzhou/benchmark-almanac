// ProxyWar tests code generation by running model-written game agents in tournaments.
// Table 3 reports the overall percentage of matches won and the average rank for each game.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.04296';
const board: Leaderboard = {
  benchmark: 'proxywar',
  static: 'paper',
  url: feed,
  feed,
  terms: PAPER_TERMS + ' https://info.arxiv.org/help/license/index.html',
  parts: {"sudoku":{"name":"Sudoku","unit":"score","better":"lower","note":"Average tournament rank."},"maze":{"name":"Maze","unit":"score","better":"lower","note":"Average tournament rank."},"game2048":{"name":"2048","unit":"score","better":"lower","note":"Average tournament rank."},"hanoi":{"name":"Hanoi","unit":"score","better":"lower","note":"Average tournament rank."},"ttt":{"name":"TTT","unit":"score","better":"lower","note":"Average tournament rank."},"connect4":{"name":"Connect4","unit":"score","better":"lower","note":"Average tournament rank."},"reversi":{"name":"Reversi","unit":"score","better":"lower","note":"Average tournament rank."},"snake":{"name":"Snake","unit":"score","better":"lower","note":"Average tournament rank."},"holdem":{"name":"Hold’em","unit":"score","better":"lower","note":"Average tournament rank."}},
  stats: { averageRevisions: { name: 'Average revisions', unit: 'count', better: 'lower' }, participation: { name: 'Participation rate', unit: '%', better: 'higher' }, errorRate: { name: 'Error rate', unit: '%', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  aliases: {"Claude3.5-Sonnet":"claude-3-5-sonnet-october-2024","Gemini2.0-Flash":"gemini-2-0-flash-feb-2025","DeepSeekV3-0324":"deepseek-v3-mar-2025","O3-Mini-20250131":"o3-mini","Qwen3-235B-0428":"qwen3-235b-a22b","Claude4-Sonnet":"claude-sonnet-4","Gemini-2.5-Flash":"gemini-2-5-flash-jun-2025","Magistral-Small":"magistral-small-1-0","Qwen2.5-Coder":"qwen2-5-coder-32b-instruct","Codex-Mini":"codex-mini-2025-05-16"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const header = ['Model', 'Sudoku', 'Maze', '2048', 'Hanoi', 'TTT', 'Connect4', 'Reversi', 'Snake', 'Hold’em',
      'A.R.', 'Part. (%)', 'Win (%)', 'Error (%)', 'Speed (s)'];
    const table = tables.find(t => t[2]?.join('|') === header.join('|'));
    if (!table) throw new Error('Missing ProxyWar tournament results');
    const keys = ["sudoku","maze","game2048","hanoi","ttt","connect4","reversi","snake","holdem"];
    const rows = table.slice(3).filter(row => !row.every(value => value === row[0])).map(([model, ...cells]) => {
      if (cells.length !== 14 || !cells.every(value => /^\d+(\.\d+)?$/.test(value))) throw new Error('Invalid ProxyWar tournament row');
      const values = cells.map(Number);
      const ranks = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
      const [averageRevisions, participation, score, errorRate, latency] = values.slice(9);
      return { model, score, metrics: { ...ranks, averageRevisions, participation, errorRate, latency } };
    });
    // Table 2 identifies the October 2024 release of Claude 3.5 Sonnet.
    return checked(rows, 18).map(row => row.model === 'Claude3.5-Sonnet (snapshot unspecified)'
      ? { ...row, model: 'Claude3.5-Sonnet' } : row);
  },
};
export default board;
