// VideoDR (with search), the 100-question set. videodr-benchmark.github.io is a Vue app built from the
// videodr-benchmark/videodr-benchmark.github.io repository, whose leaderboard-config.json holds the table
// (the built bundle embeds the same leaderboardData): one row per model and framework, Workflow or Agentic,
// with ACC (answer accuracy, %, the score), think calls, search calls and total time. The framework is
// kept as the harness, and the other three table columns go in metrics: "thinkCalls", "searchCalls" and
// "totalTime" (the board's "Total Time (s)"). The later 500-question set has its own scores and is not on this board.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/videodr-benchmark/videodr-benchmark.github.io/main/leaderboard-config.json';

interface Config {
  pageMetadata?: { totalTasks?: number };
  leaderboardData: { Framework?: string; LLM: string; ACC?: number; ThinkCount?: number; SearchCount?: number; TotalTime?: number }[];
}

const board: Leaderboard = {
  benchmark: 'videodr-with-search',
  url: 'https://videodr-benchmark.github.io/#/home',
  feed: FEED,
  terms: 'Repository file behind the VideoDR GitHub Pages site, which states no license or terms; the VideoDR benchmark repository is MIT.',
  aliases: {
    // the paper's runs (January 2026) through the API alias gpt-4o, which then pointed at the August 2024 snapshot
    'GPT-4o': 'gpt-4o-aug-2024',
  },
  async fetch() {
    const cfg = await fetchJson<Config>(FEED);
    if (cfg.pageMetadata?.totalTasks && cfg.pageMetadata.totalTasks !== 100) throw new Error(`VideoDR board now has ${cfg.pageMetadata.totalTasks} tasks`);
    const rows: LeaderboardRow[] = [];
    for (const r of cfg.leaderboardData) {
      if (typeof r.ACC !== 'number' || !r.LLM) continue;
      const metrics: Record<string, number> = {};
      for (const [k, v] of [
        ['thinkCalls', r.ThinkCount],
        ['searchCalls', r.SearchCount],
        ['totalTime', r.TotalTime],
      ] as const)
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      rows.push({ model: r.LLM.trim(), harness: r.Framework || undefined, score: r.ACC, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
