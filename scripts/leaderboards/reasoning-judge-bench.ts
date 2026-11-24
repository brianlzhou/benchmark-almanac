// ReasoningJudgeBench tests whether a judge selects the correct answer in both response orders.
// Table 6 gives overall accuracy, four reasoning splits and positional consistency.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2505.13346';
const tasks = ['Multi-hop', 'Math', 'Everyday', 'Domain'];
const board: Leaderboard = {
  benchmark: 'reasoning-judge-bench', static: 'paper', url: feed, feed,
  terms: 'Salesforce releases ReasoningJudgeBench under CC BY-NC 4.0. https://github.com/SalesforceAIResearch/ReasoningJudgeBench',
  parts: Object.fromEntries(tasks.map(key => [key, { name: key, unit: '%' }])),
  stats: { consistency: { name: 'Consistency', unit: '%', better: 'higher' } },
  aliases: { 'gpt-4o-2024-08-06': 'gpt-4o-aug-2024', 'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b', 'Qwen2.5-32B-Instruct': 'qwen2-5-32b', 'Qwen2.5-72B-Instruct': 'qwen2-5-72b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b', 'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Llama-3.3-70B-Instruct': 'llama-3-3-70b', 'Llama-3.1-405B-Instruct': 'llama-3-1-405b' },
  async fetch() {
    const header = ['', 'Model', ...tasks, 'Avg.', 'Consistency'];
    const table = inlinePaperTables(await paperHtml(feed)).find(t => JSON.stringify(t[0]) === JSON.stringify(header));
    if (!table) throw new Error('Missing ReasoningJudgeBench Table 6');
    return checked(table.slice(1).map(row => {
      const label = row[1].replace(/\s*(?:†|\(Ours\))$/, '');
      const model = label === 'GPT-4o' ? 'gpt-4o-2024-08-06' : label === 'GPT-4o-mini' ? 'gpt-4o-mini-2025-04-16' : label;
      return { model, score: numberCell(row[6]), metrics: { consistency: numberCell(row[7]),
        ...Object.fromEntries(tasks.map((key, i) => [key, numberCell(row[i + 2])])) } };
    }), 32);
  },
};
export default board;
