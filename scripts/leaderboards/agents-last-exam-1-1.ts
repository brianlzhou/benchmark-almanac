// Agents' Last Exam v1.1 (122 tasks), the agents-last-exam-1-1 record. The original 1.0 record has no feed any more. agents-last-exam.org/leaderboard loads /api/demo/leaderboard/v1.1:
// one row per harness, model and reasoning variant across both platforms (the page's "all" view), with
// passRate (0 to 1, the default sort and the score), avgScore (partial credit), run count and total
// output tokens. Output tokens per task are the total over the run count. The page writes harness keys
// such as ale_claw as display names ("ALE-Claw"); the same names are used here. The feed gives task costs, token counts, durations and pass rates for Linux and Windows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agents-last-exam.org/api/demo/leaderboard/v1.1';

interface Row {
  harness: string;
  model: string;
  harnessVariant?: string;
  runs?: number;
  tasks?: number;
  splitTasks?: number;
  passes?: number;
  totalInputTokens?: number | null;
  passRate?: number;
  avgScore?: number | null;
  totalDurationS?: number | null;
  totalOutputTokens?: number | null;
  totalCostUsd?: number | null;
}

// the page's own display names for harness keys; other keys are title-cased, as the page does
const HARNESS: Record<string, string> = {
  ale_claw: 'ALE-Claw',
  grok_build: 'Grok Build',
  kimi_code: 'Kimi Code',
  openclaw: 'OpenClaw',
  openclaw_cli: 'OpenClaw',
  zcode: 'ZCode',
};
const harnessName = (k: string) => HARNESS[k] ?? k.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function totals(row: Row, prefix = '') {
  const metrics: Record<string, number> = {};
  for (const key of ['runs', 'tasks', 'splitTasks', 'passes', 'totalDurationS', 'totalInputTokens', 'totalOutputTokens', 'totalCostUsd'] as const) {
    const value = row[key];
    if (typeof value === 'number') metrics[prefix + key] = value;
  }
  return metrics;
}

const board: Leaderboard = {
  benchmark: 'agents-last-exam-1-1', measures: { partial: 'score' },
  parts: { linux: { name: 'Linux', group: 'Platform' }, windows: { name: 'Windows', group: 'Platform' } },
  url: 'https://agents-last-exam.org/leaderboard',
  feed: FEED,
  terms: 'Public JSON endpoint the leaderboard page loads (robots.txt does not restrict it); the site states the dataset is CC BY 4.0 and the code Apache-2.0.',
  aliases: {
    'deepseek-deepseek-v4-1-flash-1017': 'deepseek-v4-1-flash-1017',
    'kimi-3.1-pro': 'kimi-k3-1-pro',
    'muse-wonder-1.0': 'muse-wonder',
    'minimax-m3-1-flash': 'minimax-m3-1-flash',
  },
  async fetch() {
    const { rows, platforms } = await fetchJson<{ rows: Row[]; platforms?: Record<string, { rows: Row[] }> }>(FEED);
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      if (typeof r.passRate !== 'number') continue;
      const metrics = totals(r);
      for (const [platform, subset] of Object.entries(platforms ?? {})) {
        const part = subset.rows.find(p => p.model === r.model && p.harness === r.harness && p.harnessVariant === r.harnessVariant);
        if (!part) continue;
        if (typeof part.passRate === 'number') metrics[platform] = part.passRate * 100;
        if (typeof part.avgScore === 'number') metrics[platform + ':partial'] = part.avgScore * 100;
        Object.assign(metrics, totals(part, platform + ':'));
      }
      out.push({
        trials: r.runs,
        model: r.model,
        score: r.passRate * 100,
        setting: r.harnessVariant?.replace(/^(?:thinking|reasoning)-/, '').split('_')[0] || undefined,
        harness: harnessName(r.harness),
        tokens: r.totalOutputTokens && r.runs ? r.totalOutputTokens / r.runs : undefined,
        cost: r.totalCostUsd && r.runs ? r.totalCostUsd / r.runs : undefined,
        metrics: {
          ...metrics,
          ...(typeof r.avgScore === 'number' ? { partial: r.avgScore * 100 } : {}),
          ...(r.totalDurationS && r.runs ? { latency: r.totalDurationS / r.runs } : {}),
        },
      });
    }
    return out;
  },
};
export default board;
