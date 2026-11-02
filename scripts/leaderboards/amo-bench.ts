// AMO-Bench (Meituan LongCat). The live leaderboard on amo-bench.github.io and in the repo README is only
// an image (figures/leaderboard_<date>.png). The paper's main results table, AVG@32 accuracy per model on
// AMO-Bench and on its parser-gradable subset AMO-Bench-P, is HTML on arxiv.org (pinned to v1, so the
// numbers cannot shift). The AMO-Bench column is the score. A static paper table, so rows carry the release
// date of the paper and dataset (2025-10-31, per the README). Models the board added later (Gemini 3 Pro,
// Qwen3-Max-Thinking, GLM-4.7) appear only in the image.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://arxiv.org/html/2510.26768v1';
const DATE = '2025-10-31';

const board: Leaderboard = {
  benchmark: 'amo-bench',
  url: 'https://amo-bench.github.io/',
  feed: `${PAGE} (main results table, AMO-Bench column)`,
  terms: 'arXiv robots.txt allows /html (crawl delay 15 s; one request per sync); the AMO-Bench repository is MIT-licensed.',
  aliases: {
    'GPT-5-Thinking (High)': 'gpt-5',
    // the paper lists DeepSeek-R1-0528 separately, so plain DeepSeek-R1 is the January release
    'DeepSeek-R1': 'deepseek-r1',
    'GPT-4o-20241120': 'gpt-4o-nov-2024',
    'LongCat-Flash': 'longcat-flash-chat',
    'Qwen3-Next-80B-Instruct': 'qwen3-next-80b-a3b-instruct',
    'Qwen3-Max-Instruct': 'qwen3-max',
    // the registry's qwen3-next-80b-a3b card is Qwen3-Next-80B-A3B-Thinking
    'Qwen3-Next-80B-Thinking': 'qwen3-next-80b-a3b',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.[0]?.text === 'Model' && rows[0]?.[1]?.text === 'AMO-Bench');
    if (!t) throw new Error('AMO-Bench results table not found in the arXiv HTML');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[0]?.text.trim();
      const score = num(r[1]?.text);
      if (!model || score === undefined) continue;
      // "(High)" is the reasoning effort; DeepSeek-V3.1 is one hybrid model listed with and without thinking
      const effort = model.match(/\s*\((High|Medium|Low)\)$/)?.[1].toLowerCase();
      const setting = effort ?? (/^DeepSeek-V3\.1-Thinking$/.test(model) ? 'thinking' : /^DeepSeek-V3\.1$/.test(model) ? 'non-thinking' : undefined);
      rows.push({ model, score, setting, date: DATE });
    }
    return rows;
  },
};
export default board;
