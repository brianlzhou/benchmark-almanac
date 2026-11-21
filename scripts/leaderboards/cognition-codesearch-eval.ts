// Cognition CodeSearch Eval measures retrieval of relevant files and lines from code repositories.
// The headline is weighted F0.5 over files, which prioritizes precision. The source publishes a chart image.
// Rows were transcribed twice from the printed table on 2026-11-20.
// Image: https://cdn.sanity.io/images/2mc9cv2v/production/0669704135323f614fd0149646d55e882126f87d-1902x1284.png?w=1600&fit=max
// SHA-256: b3d48f4ce160c02942267f9242b3f82c8cc10820c4e8ae4d8efd0595ed5f7635
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const IMAGE = 'https://cdn.sanity.io/images/2mc9cv2v/production/0669704135323f614fd0149646d55e882126f87d-1902x1284.png?w=1600&fit=max';
const board: Leaderboard = {
  benchmark: 'cognition-codesearch-eval',
  url: 'https://cognition.com/blog/swe-grep',
  feed: `${IMAGE} (transcribed 2026-11-20)`,
  terms: 'Cognition publishes this results table in its article. Attribution and source licensing apply.',
  static: 'paper',
  async fetch(): Promise<LeaderboardRow[]> {
    return checked(await chartRows(IMAGE, 'b3d48f4ce160c02942267f9242b3f82c8cc10820c4e8ae4d8efd0595ed5f7635', [
      { model: 'SWE-grep', score: 0.66, metrics: { f05Lines: 0.44, outputTokensPerSecond: 2858, latency: 2.79 } },
      { model: 'SWE-grep-mini', score: 0.58, metrics: { f05Lines: 0.38, outputTokensPerSecond: 682, latency: 1.82 } },
      { model: 'Opus 4.1', score: 0.54, setting: 'non-thinking', metrics: { f05Lines: 0.34, outputTokensPerSecond: 41, latency: 64.41 } },
      { model: 'Opus 4.1', score: 0.55, setting: 'interleaved thinking', metrics: { f05Lines: 0.35, outputTokensPerSecond: 40, latency: 86.26 } },
      { model: 'Sonnet 4.5', score: 0.59, setting: 'non-thinking', metrics: { f05Lines: 0.37, outputTokensPerSecond: 69, latency: 35.90 } },
      { model: 'Sonnet 4.5', score: 0.59, setting: 'interleaved thinking', metrics: { f05Lines: 0.38, outputTokensPerSecond: 65, latency: 59.06 } },
      { model: 'Haiku 4.5', score: 0.56, metrics: { f05Lines: 0.35, outputTokensPerSecond: 142, latency: 16.12 } },
      { model: 'GPT-5-Codex', score: 0.59, metrics: { f05Lines: 0.26, outputTokensPerSecond: 43, latency: 225.08 } },
      { model: 'GPT-5', score: 0.59, setting: 'High', metrics: { f05Lines: 0.26, outputTokensPerSecond: 45, latency: 290.63 } },
      { model: 'GPT-5', score: 0.56, setting: 'Medium', metrics: { f05Lines: 0.24, outputTokensPerSecond: 56, latency: 131.12 } },
      { model: 'GPT-5', score: 0.54, setting: 'Low', metrics: { f05Lines: 0.22, outputTokensPerSecond: 50, latency: 71.05 } },
      { model: 'GPT-5', score: 0.45, setting: 'Minimal', metrics: { f05Lines: 0.22, outputTokensPerSecond: 51, latency: 26.91 } },
      { model: 'GPT-5 mini', score: 0.36, setting: 'Minimal', metrics: { f05Lines: 0.15, outputTokensPerSecond: 61, latency: 15.23 } },
    ]));
  },
};
export default board;
