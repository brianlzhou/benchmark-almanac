// RefineBench tests whether a model can revise its answers to meet an entire checklist.
// Tables 7 and 8 report task pass and checklist accuracy at each turn. The headline is
// the percentage of tasks passing at turn five, the last evaluated turn.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2511.22173';
const board: Leaderboard = {
  benchmark: 'refinebench', static: 'paper', feed, url: feed,
  terms: 'The authors publish these tables under the terms linked at https://arxiv.org/abs/2511.22173.',
  stats: Object.fromEntries(Array.from({length: 5}, (_, i) => [
    ['taskPassTurn' + (i + 1), {name: 'Task pass rate at turn ' + (i + 1), unit: '%', better: 'higher' as const}],
    ['accuracyTurn' + (i + 1), {name: 'Checklist accuracy at turn ' + (i + 1), unit: '%', better: 'higher' as const}],
  ]).flat()),
  aliases: { 'GPT-4o-mini (snapshot unspecified)': 'gpt-4o-mini', 'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    'DeepSeek-R1 (Qwen 1.5B)': 'deepseek-r1-distill-qwen-1-5b', 'DeepSeek-R1 (Qwen 7B)': 'deepseek-r1-distill-qwen-7b',
    'DeepSeek-R1 (Qwen 14B)': 'deepseek-r1-distill-qwen-14b', 'DeepSeek-R1 (Qwen 32B)': 'deepseek-r1-distill-qwen-32b',
    'DeepSeek-R1 (LLaMA 70B)': 'deepseek-r1-distill-llama-70b' },
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [id, setting] of [['A5.T7', 'Self-refinement'], ['A5.T8', 'Guided refinement']]) {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const table = figure && inlinePaperTables(figure)[0];
      if (!table || !table[0][1].startsWith('Pass') || !table[0][7].startsWith('Acc') || table[1][6] !== 't=5' || table[1][12] !== 't=5') throw new Error('Missing turn scores for ' + setting);
      for (const cells of table.slice(2)) {
        if (cells[0] === cells[1]) continue;
        const metrics: Record<string, number> = {};
        for (let i = 1; i <= 5; i++) {
          metrics['taskPassTurn' + i] = numberCell(cells[i + 1]);
          metrics['accuracyTurn' + i] = numberCell(cells[i + 7]);
        }
        rows.push({model: cells[0], setting, score: metrics.taskPassTurn5, metrics});
      }
    }
    return checked(rows, 70);
  },
};
export default board;
