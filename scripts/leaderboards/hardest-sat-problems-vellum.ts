// Vellum's Hardest SAT Problems benchmark tests 50 difficult SAT math questions.
// The score is accuracy as a percentage. This importer reads the printed labels in Vellum's chart.
// The rows were transcribed twice from the chart on 2026-11-20.
// Image: https://cdn.sanity.io/images/ghjnhoi4/production/ab06b6658b2dfe904c47a75396ec56a2e7fdee83-2017x1101.webp
// SHA-256: ede8506f3b275089c78060b92d95ef8682fbf12cb36988a4c13fd2d0dd43ec5b
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const IMAGE = 'https://cdn.sanity.io/images/ghjnhoi4/production/ab06b6658b2dfe904c47a75396ec56a2e7fdee83-2017x1101.webp';

const board: Leaderboard = {
  benchmark: 'hardest-sat-problems-vellum',
  static: 'paper',
  url: 'https://www.vellum.ai/blog/evaluation-claude-4-sonnet-vs-openai-o4-mini-vs-gemini-2-5-pro',
  feed: `${IMAGE} (transcribed 2026-11-20)`,
  terms: 'Vellum publishes this chart on its public blog. Results are credited to Vellum.',
  async fetch(): Promise<LeaderboardRow[]> {
    return checked(await chartRows(IMAGE, 'ede8506f3b275089c78060b92d95ef8682fbf12cb36988a4c13fd2d0dd43ec5b', [
      { model: 'Claude 4 Sonnet', score: 94 },
      { model: 'Qwen', score: 90 },
      { model: 'O4-Mini', score: 88 },
      { model: 'Claude 4 Opus', score: 88 },
      { model: 'OpenAI O3', score: 86 },
    ]));
  },
};

export default board;
