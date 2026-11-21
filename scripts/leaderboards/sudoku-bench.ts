// Sakana AI’s Sudoku-Bench measures the percentage of puzzles solved. Table 1 reports single-shot
// and multi-step solve rates for the full set and each grid size, plus correct placements.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.16135';
const board: Leaderboard = {
  benchmark: 'sudoku-bench', static: 'paper', url: 'https://arxiv.org/abs/2505.16135', feed, terms: PAPER_TERMS,
  aliases: { 'Qwen 3.235B A22B':'qwen3-235b-a22b', 'Qwen 3.30B A3B':'qwen3-30b-a3b', 'Qwen QwQ 32B':'qwq-32b', 'DeepSeek R1':'deepseek-r1' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const t = tables.find(t => t[0]?.[5] === 'Multi-step solve rate (%)' && t[0]?.[9] === 'Single-shot solve rate (%)');
    if (!t || t[1].length !== 13 || [4,8,12].some(i => t[1][i] !== 'All')) throw new Error('Missing Sudoku-Bench columns');
    const sizes = ['4×4','6×6','9×9'];
    board.parts = Object.fromEntries(sizes.map(k => [k,k]));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r.length !== 13) throw new Error('Incomplete Sudoku-Bench row');
      const model = r[0].replace(/ High$| \(Thinking\)$/, '');
      for (const [offset,mode] of [[5,'Multi-step'],[9,'Single-shot']] as const) {
        if (r[offset+3] === '–') continue;
        const metrics: Record<string,number> = {};
        sizes.forEach((k,i) => { metrics[k] = numberCell(r[offset+i]); });
        if (offset === 5) [...sizes,'All'].forEach((k,i) => { metrics[k+' correct placements'] = numberCell(r[1+i]); });
        const effort = r[0].endsWith(' High') ? ', high' : r[0].endsWith('(Thinking)') ? ', thinking' : '';
        rows.push({model: model === 'Gemini 2.5 Pro' ? model+' (preview snapshot unspecified)' : model,setting:mode+effort,score:numberCell(r[offset+3]),metrics});
      }
    }
    if (rows.length < 24) throw new Error('Missing Sudoku-Bench configurations');
    return rows;
  },
};
export default board;
