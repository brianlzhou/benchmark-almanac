// GSO (Global Software Optimization). gso-bench.github.io builds its table from assets/leaderboard.json:
// one entry per run with model, scaffold, setting (Opt@1 or Opt@10), reasoning effort and score, the
// percentage of tasks where the agent matched the expert speedup. Opt@1 is the headline. Matching Opt@10 scores are metrics.
// Each row names its submitting organization. The board's "Hack-Adjusted"
// column (score_hack_control: the score after a penalty for reward hacking) is kept as metrics.hackAdjusted.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://gso-bench.github.io/assets/leaderboard.json';

interface Entry {
  name: string;
  scaffold?: string;
  submission_org_name?: string;
  setting?: string;
  score: number;
  score_hack_control?: number | null;
  date?: string;
  reasoning_effort?: string | null;
}

const board: Leaderboard = {
  benchmark: 'gso-bench',
  url: 'https://gso-bench.github.io/',
  feed: FEED,
  terms: 'Static JSON on the GSO project site; the GSO repository is MIT-licensed.',
  stats: { hackAdjusted: { name: 'Hack-adjusted score', unit: '%', better: 'higher', note: 'Score after the reward-hacking penalty.' } },
  aliases: {
    'Claude Sonnet 3.5 V2': 'claude-3-5-sonnet-october-2024',
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    // run dated 2025-08-26, before the 0905 release
    'Kimi K2 Instruct': 'kimi-k2-jul-2025',
  },
  async fetch() {
    const { models } = await fetchJson<{ models: Entry[] }>(FEED);
    return models
      .filter((m) => (m.setting ?? 'Opt@1') === 'Opt@1')
      .map((m) => {
        const ten = models.find(other => other.setting === 'Opt@10' && other.name === m.name &&
          other.scaffold === m.scaffold && other.reasoning_effort === m.reasoning_effort &&
          other.date === m.date && other.submission_org_name === m.submission_org_name);
        const metrics: Record<string, number> = {};
        if (typeof m.score_hack_control === 'number') metrics.hackAdjusted = m.score_hack_control;
        if (ten) metrics.optAt10 = Number(ten.score);
        if (typeof ten?.score_hack_control === 'number') metrics.hackAdjustedAt10 = ten.score_hack_control;
        return {
          model: m.name, score: Number(m.score), harness: m.scaffold,
          setting: m.reasoning_effort?.toLowerCase() || undefined,
          date: m.date, submitter: m.submission_org_name, metrics,
        };
      });
  },
};
export default board;
