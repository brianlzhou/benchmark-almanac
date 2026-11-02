// U-MATH (Toloka, university-level math). The toloka/u-math-leaderboard Space builds its table from
// data/u_math_eval_results.json in its repository: per model and judge, u_math is [overall, text, visual]
// accuracy (0 to 100). "U-MATH Acc", the overall accuracy, is the board's always-shown column and the
// score. Every row is judged by GPT-4o (2024-08-06). A date stamp in the name dates the row. Other runs date
// from early 2025, so they are dated 2025-02-01 and the resolver picks the snapshots current then. The companion μ-MATH judge board is another
// benchmark and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/toloka/u-math-leaderboard/resolve/main/data/u_math_eval_results.json';

const board: Leaderboard = {
  benchmark: 'u-math',
  url: 'https://huggingface.co/spaces/toloka/u-math-leaderboard',
  feed: `${FEED} (u_math[0], U-MATH Acc)`,
  terms: 'Results file in the toloka/u-math-leaderboard Hugging Face Space, licensed MIT.',
  // keys without the Hub owner, which the resolver drops before its second lookup
  aliases: {
    'claude-sonnet-3.5': 'claude-3-5-sonnet-october-2024',
    'gemini-2.0-flash-thinking-exp-01-21': 'gemini-2-0-flash-thinking-jan-2025',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'Qwen2.5-72B-Instruct': 'qwen2-5-72b',
    'Ministral-8B-Instruct-2410': 'ministral-8b',
    'Mistral-Large-Instruct-2411': 'mistral-large-2-nov-2024',
    'Mistral-Small-Instruct-2501': 'mistral-small-3',
    'DeepSeek-R1': 'deepseek-r1',
    'DeepSeek-V3': 'deepseek-v3',
    'Qwen2-VL-7B-Instruct': 'qwen2-vl-7b-instruct',
    'Qwen2-VL-72B-Instruct': 'qwen2-vl-72b-instruct',
  },
  async fetch() {
    const data = await fetchJson<{ model_name?: string; u_math?: number[] }[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of data) {
      const score = m.u_math?.[0];
      if (!m.model_name || typeof score !== 'number') continue;
      const stamp = m.model_name.match(/(20\d\d)-(\d\d)-(\d\d)$/);
      rows.push({ model: m.model_name.trim(), score, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : '2025-02-01' });
    }
    return rows;
  },
};
export default board;
