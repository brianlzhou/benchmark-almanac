// FrontierMath Tier 4 tests research-level mathematics. Epoch's run export gives the fraction solved.
// The original July 2025 private task has a different identifier from the revised Tier 4 v2 task.
import type { Leaderboard } from './types.ts';
import { EPOCH_RUNS_FEED, EPOCH_SCORE_STATS, epochRunRows } from '../lib/boards/epoch-runs.ts';

export default {
  benchmark: 'frontiermath-tier-4',
  url: 'https://epoch.ai/frontiermath',
  feed: EPOCH_RUNS_FEED,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0. Its robots.txt permits the data path.',
  stats: { meanScore: EPOCH_SCORE_STATS.meanScore, 'scorer:verification_code': EPOCH_SCORE_STATS['scorer:verification_code'], 'scorerSpread:verification_code': EPOCH_SCORE_STATS['scorerSpread:verification_code'], 'Training compute (FLOP)': EPOCH_SCORE_STATS['Training compute (FLOP)'], 'Training compute cost (2023 USD)': EPOCH_SCORE_STATS['Training compute cost (2023 USD)'], activeParams: EPOCH_SCORE_STATS.activeParams },
  aliases: {
    'gpt-5.4-pro-2026-03-05-web-app': 'gpt-5-4-pro',
    'gpt-5.2-pro-2025-12-11-webapp': 'gpt-5-2-pro',
    'grok-4-heavy-web-app': 'grok-4-heavy',
    'fireworks/deepseek-v3p2': 'deepseek-v3-2',
  },
  async fetch() {
    const rows = await epochRunRows('FrontierMath-Tier-4-2025-07-01-Private');
    if (rows.length < 72) throw new Error('Expected at least 72 original Tier 4 runs in the Epoch export');
    return rows;
  },
} satisfies Leaderboard;
