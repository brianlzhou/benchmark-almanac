// K-Sort Arena (text-to-image). The Gradio Space builds its leaderboard tab from sorted_score_list.json in
// the Space repository: per model the rank, "Score (μ/σ)" written as "30.86 (33.2/0.782)", votes and
// organization. The leading number is the ranking score, the conservative rating μ − 3σ, and is the
// score here. The Space's video leaderboard file is not in the repository, so only the image board is read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://huggingface.co/spaces/ksort/K-Sort-Arena';
const FEED = `${PAGE}/resolve/main/sorted_score_list.json`;

const board: Leaderboard = {
  benchmark: 'k-sort-arena',
  url: PAGE,
  feed: `${FEED} (Score, the μ − 3σ rating)`,
  terms: 'JSON file in the public, MIT-licensed K-Sort Arena Space repository that the leaderboard tab reads.',
  aliases: {
    'SD-v3.5-large': 'stable-diffusion-3-5-large',
    // GPT-4o image generation, served in the API as gpt-image-1
    'GPT-4o': 'gpt-image-1',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ sorted_score_list: Record<string, string | number>[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of data.sorted_score_list) {
      const model = Object.entries(e).find(([k]) => /Model/.test(k))?.[1];
      const score = num(String(Object.entries(e).find(([k]) => /Score/.test(k))?.[1] ?? ''));
      if (typeof model === 'string' && score !== undefined) rows.push({ model, score });
    }
    if (!rows.length) throw new Error('no K-Sort Arena rows');
    return rows;
  },
};
export default board;
