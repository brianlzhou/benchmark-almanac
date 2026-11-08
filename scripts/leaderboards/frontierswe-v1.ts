// FrontierSWE v1: dominance is the win rate against a random opponent on a random task, converted to percent.
// The preserved v1 board defaults to mean results. Average rank remains avgRank, with task-family ranks as metrics.
// Read only the exact /v1 page, which robots.txt allows. Its /v1/ children and /api/ paths are disallowed.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const PAGE = 'https://www.frontierswe.com/v1';
interface Entry { model: string; harness: string; overall: number; dominance: number; implementation: number; performance: number; research: number }
const board: Leaderboard = {
  benchmark: 'frontierswe-v1', url: PAGE, feed: PAGE,
  terms: 'FrontierSWE allows the exact public /v1 page under robots.txt, with results credited to the publisher under its site terms.',
  async fetch() {
    // Refuse redirects so a future trailing-slash redirect cannot enter the disallowed /v1/ path.
    const entries = jsonAfter<{ mean: Entry[] }>(nextFlight(await fetchText(PAGE, { redirect: 'error' })), '"entries":').mean;
    if (!entries?.length || entries.some(r => !Number.isFinite(r.dominance))) throw new Error('FrontierSWE v1 mean dominance missing');
    return entries.map(r => ({ model: r.model, harness: r.harness, setting: 'mean', score: r.dominance * 100,
      metrics: { avgRank: r.overall, implementationRank: r.implementation, performanceRank: r.performance, researchRank: r.research },
    }));
  },
};
export default board;
