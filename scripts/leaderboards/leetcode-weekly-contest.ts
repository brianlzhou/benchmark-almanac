// DeepSeek LLM's paper reports pass@1 on all 126 July-November 2023 LeetCode contest problems.
// Read the LeetCode column, not the neighboring Hungarian Exam or IFEval columns.
// These are static paper results and will not refresh with new contest weeks.
import type { Leaderboard } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-round3-t.ts';

const FEED = 'https://arxiv.org/html/2401.02954';
const board: Leaderboard = {
  benchmark: 'leetcode-weekly-contest', url: 'https://github.com/deepseek-ai/DeepSeek-LLM', feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const table = (await paperTables(FEED)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|LeetCode|Hungarian Exam|IFEval');
    if (!table || table.length < 8) throw new Error('DeepSeek paper LeetCode table missing');
    return table.slice(1).map(c => {
      if (c.length !== 4) throw new Error('LeetCode table shape changed');
      return { model: c[0].text === 'GPT-4' ? 'GPT-4 (snapshot unspecified)' : c[0].text, score: numberCell(c[1].text) };
    });
  },
};
export default board;
