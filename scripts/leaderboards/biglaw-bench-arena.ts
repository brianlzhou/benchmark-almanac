// Lawyers compare pairs of legal answers. Harvey reports overall Elo and Elo for two practice areas.
// We transcribed the printed labels in both charts twice and compared the values. Both SVGs have hash guards.
// Harvey identifies the primary models for variants A, B and E. C and D have no published model identity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const assets = 'https://cdn.sanity.io/images/07s0r5r6/production/';
const feed = assets + '31a39773554ff98efdc1d50e6b81b24231b281ba-1200x675.svg';
const practice = assets + 'aa3462095caaaddd7cd72f769004fd701646fc6e-1200x675.svg';
const board: Leaderboard = {
  benchmark: 'biglaw-bench-arena', url: 'https://www.harvey.ai/blog/introducing-biglaw-bench-arena', feed,
  terms: 'Harvey retains copyright. https://www.harvey.ai/blog/introducing-biglaw-bench-arena',
  harnesses: 'system',
  parts: { litigation: { name: 'Litigation', unit: 'elo' }, transactional: { name: 'Transactional', unit: 'elo' } },
  async fetch() {
    await chartRows(practice, '7780e7fe7bead205889a708af5fc78f4d5faa0db5edc371fc1d1ba180617fceb', []);
    const rows: LeaderboardRow[] = [
      { model: 'GPT-5', harness: 'Harvey A', score: 1585, metrics: { litigation: 1594, transactional: 1571 } },
      { model: 'GPT-4.1', harness: 'Harvey B', score: 1500, metrics: { litigation: 1500, transactional: 1500 } },
      { model: 'Claude 4.5 Sonnet', score: 1432, metrics: { litigation: 1434, transactional: 1389 } },
      { model: 'GPT-5', score: 1418, metrics: { litigation: 1444, transactional: 1376 } },
      { model: 'GPT-4o', harness: 'Harvey E', score: 1417, metrics: { litigation: 1411, transactional: 1407 } },
      { model: 'Gemini 2.5 Pro', score: 1406, metrics: { litigation: 1424, transactional: 1384 } },
      { model: 'Claude 4 Sonnet', score: 1380, metrics: { litigation: 1339, transactional: 1392 } },
      { model: 'GPT-4o', score: 1364, metrics: { litigation: 1413, transactional: 1325 } },
    ];
    return checked(await chartRows(feed, '7bd5b61f4f5e27195020fa604f102175cda064c09eaba18b3cd911120ca45c8c', rows), 8);
  },
};
export default board;
