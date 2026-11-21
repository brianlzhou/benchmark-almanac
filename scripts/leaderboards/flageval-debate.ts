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
}

const board: Leaderboard = {
  benchmark: 'flageval-debate',
  url: PAGE,
  feed: FEED,
  terms: 'The official FlagEval ranking feed is public. The site does not state separate score reuse terms.',
  async fetch() {
    const data = await fetchJson<Entry[]>(FEED);
    const rows = data.map((entry) => {
      const name = entry.model?.trim();
      const metric = entry.metric;
      if (!name || typeof metric?.rating !== 'number') return undefined;
      return {
        model: name,
        score: metric.rating,
        ...(typeof metric.lower === 'number' && typeof metric.upper === 'number' ? { low: metric.lower, high: metric.upper } : {}),
      } satisfies LeaderboardRow;
    }).filter((row): row is LeaderboardRow => row !== undefined);
    if (rows.length < 10) throw new Error(`FlagEval Debate: ${rows.length} models, expected at least 10`);
    return rows;
  },
};

export default board;
