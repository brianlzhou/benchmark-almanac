// FullStackBench (ByteDance): Table 2 of the paper reports Overall pass@1 across all 3,374 problems.
// Domain columns are supplementary metrics. These are static paper results, not a refreshing leaderboard.
// The GitHub README image path is robots-disallowed; arXiv publishes the numbers as an allowed HTML table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2412.00535';
const board: Leaderboard = {
  benchmark: 'fullstackbench', url: 'https://github.com/bytedance/FullStackBench', feed: FEED,
  terms: PAPER_TERMS,
  aliases: {
    'GPT 4o-0806': 'gpt-4o-aug-2024',
    'DeepSeekCoder-v2-Instruct': 'deepseek-coder-v2-236b',
    'DeepSeekCoder-v2-Lite-Instruct': 'deepseek-coder-v2-lite-instruct',
    'CodeQwen1.5-7B-Chat': 'codeqwen1-5-7b',
    'OpenAI o1-preview': 'o1-preview', 'OpenAI o1-mini': 'o1-mini',
  },
  async fetch() {
    const table = (await paperTables(FEED)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|BP|AP|SE|DP|MA|DW|ML|SC|DB|MM|OS|Others|Overall');
    if (!table) throw new Error('FullStackBench Overall table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      if (cells.length === 1) continue; // parameter-count section labels
      if (cells.length !== 14) throw new Error('FullStackBench table shape changed');
      let model = cells[0].text;
      if (['Claude-35-Sonnet', 'DeepSeek-v2.5', 'Qwen-Max'].includes(model)) model += ' (snapshot unspecified)';
      rows.push({ model, score: numberCell(cells[13].text), metrics: Object.fromEntries(
        cells.slice(1, 13).map((c, i) => [table[0][i + 1].text.toLowerCase(), numberCell(c.text)])),
      });
    }
    if (rows.length < 20) throw new Error('FullStackBench paper rows missing');
    return rows;
  },
};
export default board;
