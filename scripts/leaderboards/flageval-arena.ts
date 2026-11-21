// FlagEval Arena is a pairwise chat preference leaderboard from the Beijing Academy of Artificial Intelligence.
// Its headline score is the Elo-like rating estimated from anonymous user votes.
// This importer reads the official JSON ranking feed for period 2511.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://flageval.baai.ac.cn/#/leaderboard/arena';
const FEED = 'https://flageval.baai.ac.cn/api/trending/arena/nlp?period=2511';

interface Entry {
  model?: string;
  metric?: { rating?: number; lower?: number; upper?: number };
  battles?: { count?: number }[];
  period?: string;
  organization?: string;
}

const board: Leaderboard = {
  benchmark: 'flageval-arena',
  url: PAGE,
  feed: FEED,
  terms: 'The official FlagEval Arena feed does not state separate score reuse terms. Results are credited to FlagEval.',
  stats: { battles: { name: 'Battles', unit: 'count' } },
  async fetch() {
    const data = await fetchJson<Entry[]>(FEED);
    if (data.length !== 36) throw new Error(`FlagEval Arena: ${data.length} rows, expected 36`);
    const rows = data.map((entry) => {
      const score = entry.metric?.rating;
      if (!entry.model || typeof score !== 'number' || !Number.isFinite(score)) throw new Error('FlagEval Arena: incomplete ranking row');
      const metrics: Record<string, number> = {};
      const battles = entry.battles?.reduce((sum, battle) => sum + (battle.count ?? 0), 0);
      if (battles !== undefined) metrics.battles = battles;
      return { model: entry.model, score, low: entry.metric?.lower, high: entry.metric?.upper, metrics };
    });
    return rows;
  },
};

export default board;
