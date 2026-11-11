// Agents' Last Exam v1.1 (122 tasks), the agents-last-exam-1-1 record. The original 1.0 record has no feed any more. agents-last-exam.org/leaderboard loads /api/demo/leaderboard/v1.1:
// one row per harness, model and reasoning variant across both platforms (the page's "all" view), with
// passRate (0 to 1, the default sort and the score), avgScore (partial credit), run count and total
// output tokens. Output tokens per task are the total over the run count. The page writes harness keys
// such as ale_claw as display names ("ALE-Claw"); the same names are used here. Cost is not published
// (totalCostUsd is null). Metrics: avgScore as `partial` (the page's "Score" column, 0 to 100) and the
// page's "Total Runtime" (totalDurationS) over the run count as `latency`, in seconds per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agents-last-exam.org/api/demo/leaderboard/v1.1';

interface Row {
  harness: string;
  model: string;
  harnessVariant?: string;
  runs?: number;
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

const board: Leaderboard = {
  benchmark: 'agents-last-exam-1-1',
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
    const { rows } = await fetchJson<{ rows: Row[] }>(FEED);
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      if (typeof r.passRate !== 'number') continue;
      out.push({
        model: r.model,
        score: r.passRate * 100,
        setting: r.harnessVariant?.replace(/^(?:thinking|reasoning)-/, '').split('_')[0] || undefined,
        harness: harnessName(r.harness),
        tokens: r.totalOutputTokens && r.runs ? r.totalOutputTokens / r.runs : undefined,
        cost: r.totalCostUsd && r.runs ? r.totalCostUsd / r.runs : undefined,
        metrics: {
          ...(typeof r.avgScore === 'number' ? { partial: r.avgScore * 100 } : {}),
          ...(r.totalDurationS && r.runs ? { latency: r.totalDurationS / r.runs } : {}),
        },
      });
    }
    return out;
  },
};
export default board;
