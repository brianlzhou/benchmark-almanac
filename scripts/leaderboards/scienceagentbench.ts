// ScienceAgentBench tests whether agents can write programs for data-driven scientific tasks.
// Table 3 gives success on the best of three attempts per task, with and without expert knowledge.
// The results use the original benchmark evaluation preceding the 2026 verified split.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2410.05080';
export default {
  benchmark: 'scienceagentbench', static: 'paper', url, feed: url,
  terms: 'The authors publish Table 3 on arXiv. https://arxiv.org/abs/2410.05080',
  aliases: {
    'Llama-3.1-Instruct-70B': 'llama-3-1-70b', 'Llama-3.1-Instruct-405B': 'llama-3-1-405b',
    'Mistral-Large-2 (2407)': 'mistral-large-2-jul-2024', 'GPT-4o (2024-05-13)': 'gpt-4o-may-2024',
    'Claude-3.5-Sonnet (2024-06-20)': 'claude-3-5-sonnet', 'OpenAI o1-preview': 'o1-preview',
  },
  parts: Object.fromEntries([{ key: 'cbs', name: 'CodeBERTScore', unit: '%' },
    { key: 'ver', name: 'Valid execution rate', unit: '%' }].map(({ key, ...part }) => [key, part])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[1] === 'Without Knowledge' && t[0]?.[5] === 'With Knowledge');
    if (!table || table[1].slice(1).join('|') !== ['SR', 'CBS', 'VER', 'Cost \\downarrow'].join('|') + '|' +
        ['SR', 'CBS', 'VER', 'Cost \\downarrow'].join('|')) throw new Error('Missing Table 3 metrics');
    const rows: LeaderboardRow[] = [];
    let framework = '';
    for (const cells of table.slice(2)) {
      if (cells.every(value => value === cells[0])) { framework = cells[0]; continue; }
      if (!framework) throw new Error('Missing framework');
      for (const start of [1, 5]) {
        const nums = cells.slice(start, start + 4);
        if (nums.length !== 4 || nums.some(s => !/^\d+(?:\.\d+)?$/.test(s))) throw new Error('Invalid Table 3 row');
        const [score, cbs, ver, cost] = nums.map(Number);
        const direct = framework === 'Direct Prompting';
        rows.push({ model: cells[0].replace(/\s*‡$/, ''), score, trials: 3, cost,
          harness: direct ? undefined : framework,
          setting: (direct ? 'Direct prompting, ' : '') + table[0][start].toLowerCase(),
          metrics: { cbs, ver } });
      }
    }
    return checked(rows, 34);
  },
} satisfies Leaderboard;
