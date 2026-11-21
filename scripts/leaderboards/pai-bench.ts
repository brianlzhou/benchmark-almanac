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
    const groups: Record<string, string[]> = {
      Overall: ['Domain', 'Quality'],
      Domain: ['Common Sense', 'AV', 'Robot', 'Industry', 'Human', 'Physics'],
      Quality: ['Subject Consistency', 'Background Consistency', 'Motion Smoothness', 'Aesthetic Quality',
        'Imaging Quality', 'Overall Consistency', 'I2V Subject', 'I2V Background'],
    };
    const parts: Record<string, { name: string; group: string }> = {};
    for (const [group, names] of Object.entries(groups)) {
      for (const name of names) {
        const key = name.split(' ').map((word, i) => i ? word : word.toLowerCase()).join('');
        parts[key] = {name, group};
      }
    }
    board.parts = parts;
    const data = await fetchJson<{ [key: string]: unknown; model: string; Overall?: number }[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (!r.model || /^source$/i.test(r.model) || typeof r.Overall !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [key, part] of Object.entries(parts)) {
        const score = r[part.name];
        if (typeof score === 'number') metrics[key] = score;
      }
      rows.push({ model: r.model, score: r.Overall, metrics });
    }
    return rows;
  },
};
export default board;
