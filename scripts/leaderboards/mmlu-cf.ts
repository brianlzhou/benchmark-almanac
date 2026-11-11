// MMLU-CF (Microsoft, contamination-free MMLU). The makers keep the leaderboard as an HTML table in the
// microsoft/MMLU-CF README: per model the original MMLU score and MMLU-CF on its test and validation splits,
// 5-shot and 0-shot. The first MMLU-CF column, 5-shot accuracy on the test split (0 to 100), is the
// headline. Preserve both 5-shot and 0-shot test configurations with validation metrics. Rows that only label a group ("API", "Open-source") are skipped. The table comes
// from the paper (arXiv 2412.15194, December 2024), so rows are dated 2024-12-01 and the resolver picks the
// snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'microsoft/MMLU-CF';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'mmlu-cf',
  url: `https://github.com/${REPO}`,
  feed: `${FEED} (Leaderboard table, MMLU-CF 5-shot Test)`,
  terms: 'README table in the microsoft/MMLU-CF GitHub repository, which is MIT-licensed.',
  // chat and instruct models map to the registry's one record per family
  aliases: {
    'Llama-3-70B-instruct': 'llama-3-70b',
    'Llama-3-8B-instruct': 'llama-3-8b',
    'Llama-3.1-70B-instruct': 'llama-3-1-70b',
    'Llama-3.1-8B-instruct': 'llama-3-1-8b',
    'Llama-2-70B-chat': 'llama-2-70b',
    'Llama-2-13B-chat': 'llama-2-13b',
    'Llama-2-7B-chat': 'llama-2-7b',
    'Mixtral-8x22B-instruct': 'mixtral-8x22b',
    'Mixtral-8x7B-instruct-v0.1': 'mixtral-8x7b',
    'Mistral-7B-instruct-v0.3': 'mistral-7b-v0-3',
    'Qwen2.5-32B-instruct': 'qwen2-5-32b',
    'Qwen2.5-14B-instruct': 'qwen2-5-14b',
    'Qwen2.5-7B-instruct': 'qwen2-5-7b',
    'Qwen2.5-3B-instruct': 'qwen2-5-3b',
    'Qwen2.5-1.5B-instruct': 'qwen2-5-1-5b',
    'Qwen2.5-0.5B-instruct': 'qwen2-5-0-5b',
    'Yi-1.5-34B-chat': 'yi-1-5-34b',
    'Phi-4-14B': 'phi-4',
    'Phi-3.5-mini-instruct (3.8B)': 'phi-3-5-mini',
  },
  async fetch() {
    const t = tables(await fetchText(FEED)).find((x) => x[1]?.[0]?.text === '5-shot' && x[1]?.[1]?.text === '5-shot Test');
    if (!t) throw new Error('MMLU-CF table not found');
    const rows: LeaderboardRow[] = [];
    // data rows: Model, MMLU (5-shot), MMLU-CF 5-shot Test, ...
    for (const r of t.slice(2)) {
      const score = num(r[2]?.text);
      if (!r[0]?.text) continue;
      const validation5 = num(r[3]?.text), test0 = num(r[5]?.text), validation0 = num(r[6]?.text);
      if (score !== undefined) rows.push({ model: r[0].text, score, date: '2024-12-01', setting: '5-shot test', metrics: validation5 === undefined ? undefined : {validation: validation5} });
      if (test0 !== undefined) rows.push({ model: r[0].text, score: test0, date: '2024-12-01', setting: '0-shot test', metrics: validation0 === undefined ? undefined : {validation: validation0} });
    }
    return rows;
  },
};
export default board;
