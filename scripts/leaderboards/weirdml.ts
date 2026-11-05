// WeirdML v2 (17 tasks). htihle.github.io/weirdml_v2.html builds its table from /data/weirdml_data.csv: one
// row per model and effort with per-task accuracies, avg_acc (mean best test accuracy over the tasks, 0 to
// 1), cost per run and mean output tokens. avg_acc times 100 is the score. The display name carries the
// effort in brackets ("gpt-6-astra (max)"), which becomes the setting. The model slug is the name read.
// WeirdML v3 is weirdml-v3.ts. The page defines cost per run as one model run on one task, all iterations
// included, so it is the cost per task. Its "Total Output Tokens" is per LLM call (a run makes several), so it
// is kept as metrics.tokensPerCall, not as tokens per task; the page's tokens scatter is redrawn from it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://htihle.github.io/data/weirdml_data.csv';

const board: Leaderboard = {
  benchmark: 'weirdml',
  url: 'https://htihle.github.io/weirdml_v2.html',
  feed: `${FEED} (avg_acc)`,
  terms: "CSV on the author's public GitHub Pages site, which states no license or terms.",
  chart: {
    title: 'Average accuracy against output tokens',
    note: 'Average total output tokens per response (reasoning plus completion) against average accuracy over all tasks.',
    x: { key: 'tokensPerCall', label: 'Output tokens per response', unit: 'tokens', better: 'lower', log: true },
    y: { key: 'score', label: 'Average accuracy', unit: '%', better: 'higher' },
  },
  aliases: {
    'x-ai/grok-4-07-09': 'grok-4',
    // the row's release date is 2025-01-19, the January R1 (the May update has its own slug)
    'deepseek/deepseek-r1': 'deepseek-r1',
    'anthropic/claude-4-sonnet-20250522': 'claude-sonnet-4',
    'anthropic/claude-4-opus-20250522': 'claude-opus-4',
    'nvidia/nemotron-3-ultra-550b-a55b': 'nemotron-3-ultra',
    // OpenRouter's qwen3-235b-a22b-07-25 is the July 2025 Instruct release
    'qwen/qwen3-235b-a22b-07-25': 'qwen3-235b-a22b-instruct-jul-2025',
    'deepseek/deepseek-chat-v3.1': 'deepseek-v3-1',
    'accounts/fireworks/models/deepseek-v4-pro': 'deepseek-v4-pro',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const acc = Number(r.avg_acc);
      if (!r.display_name || !Number.isFinite(acc)) continue;
      const effort = r.display_name.match(/\s*\(([^()]+)\)\s*$/)?.[1];
      const name = (r.model_slug || r.display_name.replace(/\s*\([^()]+\)\s*$/, '')).trim();
      const cost = Number(r.cost_per_run_usd);
      const tokens = Number(r.mean_total_output_tokens);
      rows.push({
        model: name,
        score: acc * 100,
        setting: effort,
        date: /^\d{4}-\d\d-\d\d$/.test(r.release_date ?? '') ? r.release_date : undefined,
        cost: Number.isFinite(cost) && cost > 0 ? cost : undefined,
        ...(Number.isFinite(tokens) && tokens > 0 ? { metrics: { tokensPerCall: tokens } } : {}),
      });
    }
    return rows;
  },
};
export default board;
