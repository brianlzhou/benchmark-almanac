// EEBench (atopile). eebench.org renders its leaderboard from src/leaderboard-data.js, a generated script
// that assigns one JSON object, window.EEBENCH_LEADERBOARD: per model the scaffold, reasoning effort,
// score_pct (mean over the 13 V1 core questions, 0 to 100, the ranking), average cost and output tokens per
// attempt. The object is read as data (JSON after the assignment), never run. score_pct is the score,
// the scaffold the harness and the effort the setting. Metrics: stderr_pct (`stderr`, the "±" after the
// score), avg_steps (`steps`) and avg_duration_s (`latency`, seconds per attempt), the x-axes of the page's
// score scatter besides cost and tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://eebench.org/';

interface Model {
  name: string;
  scaffold?: string;
  reasoning_effort?: string;
  score_pct?: number;
  avg_cost_usd?: number;
  avg_output_tokens?: number;
  stderr_pct?: number;
  avg_steps?: number;
  avg_duration_s?: number;
}

const board: Leaderboard = {
  benchmark: 'eebench',
  url: PAGE,
  feed: `${PAGE}src/leaderboard-data.js (window.EEBENCH_LEADERBOARD)`,
  terms: 'Generated data script on the public eebench.org site, which publishes no robots.txt and no terms.',
  aliases: {
    // Meta's Muse Wonder, version 1.0 (the Full tier is named "Muse Wonder Full")
    'Muse Wonder 1.0': 'muse-wonder',
  },
  chart: {
    title: 'Benchmark score versus per-task metrics',
    note: 'The board switches the x-axis between cost, tokens, steps and time. This is its Time view: mean seconds per attempt.',
    x: { key: 'latency', label: 'Time per attempt', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Score', unit: '%', better: 'higher' },
  },
  async fetch() {
    // the script name carries a cache-busting query that changes with each update, so it is found in the page
    const src = (await fetchText(PAGE)).match(/src="(\/?src\/leaderboard-data\.js[^"]*)"/)?.[1];
    if (!src) throw new Error('no leaderboard-data script on the EEBench page');
    const data = jsonAfter<{ models: Model[] }>(await fetchText(new URL(src, PAGE).href), 'window.EEBENCH_LEADERBOARD =');
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      if (!m.name || typeof m.score_pct !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof m.stderr_pct === 'number') metrics.stderr = m.stderr_pct;
      if (typeof m.avg_steps === 'number') metrics.steps = m.avg_steps;
      if (typeof m.avg_duration_s === 'number') metrics.latency = m.avg_duration_s;
      rows.push({
        model: m.name.trim(),
        score: m.score_pct,
        setting: m.reasoning_effort || undefined,
        harness: m.scaffold || undefined,
        cost: m.avg_cost_usd,
        tokens: m.avg_output_tokens,
        metrics,
      });
    }
    return rows;
  },
};
export default board;
