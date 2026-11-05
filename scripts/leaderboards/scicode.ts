// SciCode. scicode-bench.github.io/leaderboard/ is an MkDocs page built from docs/leaderboard.md in the
// scicode-bench/scicode-bench.github.io repository: one markdown table with the Main Problem Resolve Rate
// (the ranking, bold) and the Subproblem rate (gray, the tie-breaker). The main-problem rate is the score.
// The table has not changed since early 2025 (o3-mini is the newest model). The subproblem rate is kept as
// metrics.subproblem.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/scicode-bench/scicode-bench.github.io/main/docs/leaderboard.md';

const board: Leaderboard = {
  benchmark: 'scicode',
  url: 'https://scicode-bench.github.io/leaderboard/',
  feed: FEED,
  terms: 'Markdown file in the scicode-bench/scicode-bench.github.io repository, which has no license; the SciCode repository is Apache-2.0.',
  aliases: {
    'OpenAI o1-preview': 'o1-preview',
    'OpenAI o1-mini': 'o1-mini',
    'Claude3.5-Sonnet': 'claude-3-5-sonnet',
    'Claude3.5-Sonnet (new)': 'claude-3-5-sonnet-october-2024',
    'Claude3-Opus': 'claude-3-opus',
    'Claude3-Sonnet': 'claude-3-sonnet',
    // the rows carry no dates: the paper's mid-2024 runs and the early-2025 additions use these snapshots
    'GPT-4o': 'gpt-4o-may-2024',
    'GPT-4-Turbo': 'gpt-4-turbo-apr-2024',
    'Gemini 1.5 Pro': 'gemini-1-5-pro-may-2024',
    'Deepseek-R1': 'deepseek-r1',
    'Deepseek-v3': 'deepseek-v3',
    'Deepseek-Coder-v2': 'deepseek-coder-v2-236b',
    'Llama-3.1-405B-Chat': 'llama-3-1-405b',
    'Llama-3.1-70B-Chat': 'llama-3-1-70b',
    'Llama-3-70B-Chat': 'llama-3-70b',
    'Mixtral-8x22B-Instruct': 'mixtral-8x22b',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const rows: LeaderboardRow[] = [];
    for (const line of md.split('\n')) {
      const cells = line.split('|').slice(1, -1).map((c) => text(c).replace(/\*/g, '').trim());
      if (cells.length < 3 || cells[0] === 'Models' || /^:?-+:?$/.test(cells[0])) continue;
      const score = Number(cells[1]);
      if (!Number.isFinite(score)) continue;
      // "🥇 OpenAI o3-mini-low": medal emoji and vendor word dropped
      let model = cells[0].replace(/^[^\p{L}\p{N}]+/u, '').replace(/^OpenAI\s+(?=o\d)/, '').trim();
      // "o3-mini-high": the registry lists "o3-mini (high)" as a plain alias, so split the effort here
      const effort = model.match(/-(low|medium|high)$/);
      if (effort) model = model.slice(0, effort.index);
      const subproblem = Number(cells[2]);
      rows.push({ model, score, setting: effort?.[1], ...(cells[2] && Number.isFinite(subproblem) ? { metrics: { subproblem } } : {}) });
    }
    if (!rows.length) throw new Error('no rows in the SciCode leaderboard table');
    return rows;
  },
};
export default board;
