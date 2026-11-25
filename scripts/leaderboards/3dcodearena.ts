// 3DCodeArena single-turn pool: combined Bradley-Terry Elo from the live Next.js payload.
// Keep modality scores, confidence bounds, vote counts, executability and the published cost frontier.
import type { Leaderboard } from './types.ts';
import { code3dRows } from '../lib/boards/3dcodearena.ts';
const board: Leaderboard = {
  benchmark: '3dcodearena', url: 'https://www.3dcodebench.com/leaderboard',
  parts: {
    bt_elo_text: { name: 'Text', group: 'Modality' },
    bt_elo_image: { name: 'Image', group: 'Modality' },
  },
  stats: {
    elo_text: { name: 'Text online Elo (K=4)', unit: 'elo', better: 'higher' },
    elo_text_k8: { name: 'Text online Elo (K=8)', unit: 'elo', better: 'higher' },
    elo_image: { name: 'Image online Elo (K=4)', unit: 'elo', better: 'higher' },
    elo_image_k8: { name: 'Image online Elo (K=8)', unit: 'elo', better: 'higher' },
    elo_combined: { name: 'Combined online Elo (K=4)', unit: 'elo', better: 'higher' },
    elo_combined_k8: { name: 'Combined online Elo (K=8)', unit: 'elo', better: 'higher' },
    n_games_text: { name: 'Text games', unit: 'count' },
    n_games_image: { name: 'Image games', unit: 'count' },
    n_games_combined: { name: 'Combined games', unit: 'count' },
    ok_text: { name: 'Text executable prompts', unit: 'count', note: 'Prompts that produced executable Blender code and a non-empty mesh.' },
    ok_image: { name: 'Image executable prompts', unit: 'count', note: 'Prompts that produced executable Blender code and a non-empty mesh.' },
    total_text: { name: 'Text prompts', unit: 'count' },
    total_image: { name: 'Image prompts', unit: 'count' },
    exec_text: { name: 'Text code-run rate', unit: 'score', better: 'higher', note: 'Fraction of prompts where the model produced executable Blender code and a non-empty mesh, from 0 to 1.' },
    exec_image: { name: 'Image code-run rate', unit: 'score', better: 'higher', note: 'Fraction of prompts where the model produced executable Blender code and a non-empty mesh, from 0 to 1.' },
  },
  feed: 'https://www.3dcodebench.com/leaderboard (models payload); https://www.3dcodebench.com/ (cost chart)',
  terms: 'Public 3DCodeBench results. No separate data license is stated on the leaderboard; the almanac credits and links the source.',
  aliases: { 'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b' },
  chart: { title: 'Cost vs. Human-Preference Elo', x: { key: 'listPriceCostPerQuery', label: 'Per-query list-price cost', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: '3DCodeArena BT-Elo', unit: 'Elo', better: 'higher' } },
  fetch: () => code3dRows(),
};
export default board;
