// 3DCodeArena single-turn pool: combined Bradley-Terry Elo from the live Next.js payload.
// Keep modality scores, confidence bounds, vote counts, executability and the published cost frontier.
import type { Leaderboard } from './types.ts';
import { code3dRows } from '../lib/boards/3dcodearena.ts';
const board: Leaderboard = {
  benchmark: '3dcodearena', url: 'https://www.3dcodebench.com/leaderboard',
  feed: 'https://www.3dcodebench.com/leaderboard (models payload); https://www.3dcodebench.com/ (cost chart)',
  terms: 'Public 3DCodeBench results. No separate data license is stated on the leaderboard; the almanac credits and links the source.',
  aliases: { 'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b' },
  chart: { title: 'Cost vs. Human-Preference Elo', x: { key: 'listPriceCostPerQuery', label: 'Per-query list-price cost', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: '3DCodeArena BT-Elo', unit: 'Elo', better: 'higher' } },
  fetch: () => code3dRows(),
};
export default board;
