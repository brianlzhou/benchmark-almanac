// Workspace-Bench-Lite: 100 tasks, separate from the full 388-task benchmark.
// The site sorts by rubric_pass_rate, already a percentage. Preserve harness and difficulty/threshold metrics.
// Read the JSON assignment as data, never execute the site's JavaScript. No per-run cost/token fields exist.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
const PAGE = 'https://workspace-bench.github.io/leaderboard.html';
interface Run {
  model: string; harness: string; split_name: string; date: string;
  rubric_pass_rate: number; easy_rubrics_accuracy: number; medium_rubrics_accuracy: number; hard_rubrics_accuracy: number;
  pass_at: Record<string, number>;
}
const board: Leaderboard = {
  benchmark: 'workspacebench-lite', url: PAGE,
  feed: 'https://workspace-bench.github.io/data/site-data.js (detailedRubricsResults.rows)',
  terms: 'The official public leaderboard publishes these results; the Almanac credits and links Workspace-Bench and preserves source attribution.',
  aliases: { 'Opus-4.7': 'claude-opus-4-7', 'Kimi-2.5': 'kimi-k2-5', 'Gemini-3.1-Pro': 'gemini-3-1-pro' },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const script = html.match(/src="([^"<>]*data\/site-data\.js[^"<>]*)"/)?.[1];
    if (!script) throw new Error('Workspace-Bench site data script missing');
    await new Promise(r => setTimeout(r, 1100));
    const data = jsonAfter<{ detailedRubricsResults: { rows: Run[]; rowCount: number } }>(await fetchText(new URL(script, PAGE).href), 'window.WORKSPACE_BENCH_SITE_DATA =');
    const runs = data.detailedRubricsResults;
    if (!runs?.rows?.length || runs.rows.length !== runs.rowCount) throw new Error('Workspace-Bench detailed row count mismatch');
    return runs.rows.map(r => {
      if (!Number.isFinite(r.rubric_pass_rate)) throw new Error('Workspace-Bench rubric score missing');
      return { model: r.model, score: r.rubric_pass_rate, harness: r.harness, setting: r.split_name, date: r.date,
        metrics: { easy: r.easy_rubrics_accuracy, medium: r.medium_rubrics_accuracy, hard: r.hard_rubrics_accuracy,
          ...Object.fromEntries(Object.entries(r.pass_at).map(([k,v]) => [`taskPassThreshold${k}`,v])) } };
    });
  },
};
export default board;
