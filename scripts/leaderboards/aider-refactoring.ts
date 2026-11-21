// Aider measures successful single-pass refactors in existing Python code.
// The results page displays pass_rate_1 from the project’s YAML run summaries.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { parse } from 'yaml';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/refactor_leaderboard.yml";

const board: Leaderboard = {
  benchmark: "aider-refactoring",
  url: "https://aider.chat/docs/leaderboards/refactor.html",
  feed,
  terms: "Aider's repository uses Apache 2.0. The raw GitHub host returns 404 for robots.txt, and aider.chat lists its sitemap.",
  aliases: { 'DeepSeek Chat V2.5': 'deepseek-v2-5-sep-2024', 'gpt-4-turbo-2024-04-09 (udiff)': 'gpt-4-turbo-apr-2024', 'gpt-4-turbo-2024-04-09 (diff)': 'gpt-4-turbo-apr-2024',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024' },
  async fetch() {
    const runs = parse(await fetchText(feed)) as Record<string, string | number>[];
    if (!Array.isArray(runs) || runs.length < 14) throw new Error('Missing Aider refactoring runs');
    return runs.map(run => {
      if (typeof run.model !== 'string' || !run.edit_format || !run.date || !Number.isFinite(run.pass_rate_1)
          || !(Number(run.test_cases) > 0)) throw new Error('Invalid Aider run');
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries(run)) {
        if (typeof value === 'number' && key !== 'pass_rate_1') metrics[key === 'seconds_per_case' ? 'latency' : key] = value;
      }
      return { model: run.model, harness: 'aider', setting: String(run.edit_format), date: String(run.date),
        score: Number(run.pass_rate_1), cost: Number(run.total_cost) > 0 ? Number(run.total_cost) / Number(run.test_cases) : undefined, metrics };
    });
  },
};

export default board;
