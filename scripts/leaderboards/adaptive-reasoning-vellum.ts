// Vellum's Adaptive Reasoning benchmark tests 28 familiar logic puzzles with modified premises to check whether
// models adapt to new context instead of reciting memorized answers.
// The score is accuracy as a percentage. This importer reads the printed labels in Vellum's chart.
// The rows were transcribed twice from the chart on 2026-11-24.
// Image: https://cdn.sanity.io/images/ghjnhoi4/production/e1445ca9fc8728cc17c97096bc6bb61ea8a1c250-2017x1101.webp
// SHA-256: 22a49ea0e4eceb443c92b593b861cea2872e3a53048cde44e4285928a2ded5e2
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const IMAGE = 'https://cdn.sanity.io/images/ghjnhoi4/production/e1445ca9fc8728cc17c97096bc6bb61ea8a1c250-2017x1101.webp';

const board: Leaderboard = {
  benchmark: 'adaptive-reasoning-vellum',
  url: 'https://www.vellum.ai/blog/evaluation-claude-4-sonnet-vs-openai-o4-mini-vs-gemini-2-5-pro',
  feed: `${IMAGE} (transcribed 2026-11-24)`,
  terms: 'Vellum publishes this chart on its public blog. Results are credited to Vellum.',
  async fetch(): Promise<LeaderboardRow[]> {
    return checked(
      await chartRows(IMAGE, '22a49ea0e4eceb443c92b593b861cea2872e3a53048cde44e4285928a2ded5e2', [
        { model: 'Gemini 2.5 Pro', score: 77.8 },
        { model: 'Claude 4 Sonnet', score: 74.1 },
        { model: 'OpenAI O3', score: 66.7 },
        { model: 'Claude 4 Opus', score: 66.7 },
        { model: 'O4-Mini', score: 59.3 },
      ]),
      5,
    );
  },
};

export default board;
