// FlagEval Debate is a Chinese debate arena that ranks language models by pairwise
// human preferences. This importer reads the official JSON ranking feed, keeping
// the Bradley-Terry rating and its published confidence bounds for each model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://flageval.baai.ac.cn/#/leaderboard/debate';
const FEED = 'https://flageval.baai.ac.cn/api/trending/arena/nlp';

interface Entry {
  model?: string;
  metric?: { rating?: number; lower?: number; upper?: number };
  avgWinRate?: number;
  battles?: { count?: number }[];
  opensource?: boolean;
}

const board: Leaderboard = {
  benchmark: 'flageval-debate',
  stats: {
    avgWinRate: { name: 'Average win rate', unit: '%', better: 'higher' },
    battles: { name: 'Pairwise battles', unit: 'count' },
  },
  url: PAGE,
  feed: FEED,
  terms: 'The official FlagEval ranking feed is public. The site does not state separate score reuse terms.',
  async fetch() {
    const data = await fetchJson<Entry[]>(FEED);
    const rows = data.map((entry) => {
      const name = entry.model?.trim();
      const metric = entry.metric;
      if (!name || typeof metric?.rating !== 'number') return undefined;
      const metrics: Record<string, number> = {};
      if (typeof entry.avgWinRate === 'number' && Number.isFinite(entry.avgWinRate)) {
        metrics.avgWinRate = Number((entry.avgWinRate * 100).toFixed(2));
      }
      if (Array.isArray(entry.battles) && entry.battles.length) {
        const total = entry.battles.reduce((s, b) => s + (typeof b.count === 'number' ? b.count : 0), 0);
        if (total > 0) metrics.battles = total;
      }
      return {
        model: name,
        score: metric.rating,
        ...(typeof metric.lower === 'number' && typeof metric.upper === 'number' ? { low: metric.lower, high: metric.upper } : {}),
        ...(typeof entry.opensource === 'boolean' ? { open: entry.opensource } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      } satisfies LeaderboardRow;
    }).filter((row): row is LeaderboardRow => row !== undefined);
    if (rows.length < 10) throw new Error(`FlagEval Debate: ${rows.length} models, expected at least 10`);
    return rows;
  },
};

export default board;
