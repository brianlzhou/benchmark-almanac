// ChinaBench measures Chinese cultural instinct across 51 questions asked three times per model.
// Its headline score is the percentage of questions passed at pass@3, and the board also publishes a party index.
// This importer reads results.json from the static leaderboard site.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://chinabench.vercel.app/';
const FEED = 'https://chinabench.vercel.app/results.json';
const board: Leaderboard = {
  benchmark: 'chinabench',
  url: PAGE,
  feed: FEED,
  terms: 'The site publishes results.json without a separate reuse license. Results are credited to the ChinaBench authors.',
  aliases: {
    'Qwen 3.7 Plus': 'qwen3-7-plus',
    'DeepSeek V4 Flash': 'deepseek-v4-flash',
  },
  parts: {
    culture: { name: 'Cultural Instinct', group: 'Axis' },
    party: { name: 'Communism Index', group: 'Axis' },
  },
  async fetch() {
    const data = await fetchJson<{ k?: number; generated_at?: string; leaderboard?: Array<Record<string, unknown>> }>(FEED);
    if (data.k !== 3 || !data.generated_at || !Array.isArray(data.leaderboard) || data.leaderboard.length < 8) throw new Error('ChinaBench: unexpected results shape');
    const rows: LeaderboardRow[] = data.leaderboard.map((m) => {
      if (typeof m.label !== 'string' || typeof m.overall !== 'number' || typeof m.party !== 'number') throw new Error('ChinaBench: row missing headline scores');
      const metrics: Record<string, number> = { party: m.party };
      if (typeof m.pass1 === 'number') metrics.pass1 = m.pass1;
      return { model: m.label, score: m.overall, date: data.generated_at!.slice(0, 10), metrics };
    });
    return rows;
  },
};
export default board;
