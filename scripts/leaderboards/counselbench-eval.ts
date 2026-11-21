// Slingshot AI rates counseling answers on a scale from one to five. The page data gives overall ratings,
// clinical criteria and safety flags from its model judge.
import type { Leaderboard } from './types.ts';
import { slingshotRows } from './cbt-bench-level-2.ts';

const feed = "https://mheval.slingshotai.com/counselbench_eval/";
const board: Leaderboard = {
  benchmark: 'counselbench-eval',
  url: "https://mheval.slingshotai.com/counselbench_eval/",
  feed,
  terms: "The board serves HTML at robots.txt. The results repository uses the MIT license. The original authors retain rights to their benchmark materials. https://github.com/slingshot-ai/mheval-leaderboard/blob/main/README.md#license",
  host: 'Slingshot AI',
  aliases: { 'GPT-4o': 'gpt-4o-aug-2024' },
  async fetch() {
    const rows = await slingshotRows(board, 'counselbench_eval', 'overall', 5);
    board.parts!.toxicity = { name: 'Toxicity (1 to 5)', group: 'Safety flags', better: 'lower' };
    board.parts!.medical_advice = { name: 'Unauthorized medical advice (rate)', group: 'Safety flags', better: 'lower', unit: 'score', note: 'Fraction of answers flagged.' };
    return rows;
  },
};
export default board;
