// PAI-Bench (Physical AI Bench), generation track. The leaderboard Space (shi-labs/physical-ai-bench-
// leaderboard, MIT) keeps each track's table as a JSON file in data/; this record is the video generation
// track, data/generation-leaderboard.json: per model the Overall score (0 to 100, the ranking) and its
// Domain and Quality parts. Overall is the score. The "Source" row is the real-video reference and is
// skipped. Most entries are open video models (Cosmos, Wan 2.2, CogVideoX) not in the registry.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/shi-labs/physical-ai-bench-leaderboard/resolve/main/data/generation-leaderboard.json';

const board: Leaderboard = {
  benchmark: 'pai-bench',
  url: 'https://huggingface.co/spaces/shi-labs/physical-ai-bench-leaderboard',
  feed: `${FEED} (Overall)`,
  terms: 'JSON file in an MIT-licensed Hugging Face Space, fetched through the Hub file API.',
  async fetch() {
    const data = await fetchJson<{ model: string; Overall?: number }[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (!r.model || /^source$/i.test(r.model) || typeof r.Overall !== 'number') continue;
      rows.push({ model: r.model, score: r.Overall });
    }
    return rows;
  },
};
export default board;
