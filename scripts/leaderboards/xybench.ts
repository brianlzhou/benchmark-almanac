// XYBench tests whether models identify hidden misconceptions and answer the stated and implicit requests.
// Table 2 reports the source-wide average of the Fully Pragmatic score for five models.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2609.06842';
const board: Leaderboard = {
  benchmark: 'xybench', url: feed, feed, static: 'paper',
  terms: 'The authors publish this table on arXiv. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',
  aliases: { 'Claude Sonnet 4.6': 'claude-sonnet-4-6', 'Gemini 3.1 Pro': 'gemini-3-1-pro', 'Qwen3.5-9B': 'qwen3-5-9b', 'DeepSeek-V4 Pro': 'deepseek-v4-pro' },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].includes('Fully') && t[2]?.[1] === 'Model');
    if (!t) throw new Error('Missing XYBench model results');
    const rows = t.slice(3).filter(r => r[0] === 'Stack Overflow' && !r[1].startsWith('Human'));
    const aliases: Record<string,string> = { 'Claude Sonnet 4.6': 'claude-sonnet-4-6', 'GPT-5': 'gpt-5', 'Gemini 3.1 Pro': 'gemini-3-1-pro', 'Qwen3.5-9B': 'qwen3-5-9b', 'DeepSeek-V4 Pro': 'deepseek-v4-pro' };
    return checked(rows.map(r => ({ model: aliases[r[1]] ?? r[1], score: Number((Number(r[8]) * 100).toFixed(2)), metrics: { sSolution: Number(r[2]), iSolution: Number(r[3]), misconceptionIdentification: Number(r[7]), fullyPragmatic: Number(r[8]), fullyCooperative: Number(r[9]) } })), 5);
  },
};
export default board;
