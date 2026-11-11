// FRAMES: the official dataset card publishes four whole-set retrieval configurations.
// Read their accuracy percentages live. Keep the card's exact model label without inventing a snapshot alias.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://huggingface.co/datasets/google/frames-benchmark/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'frames', url: 'https://huggingface.co/datasets/google/frames-benchmark', feed: FEED,
  terms: 'Google publishes the dataset card under Apache-2.0. Benchmark Almanac credits and links the source.',
  async fetch() {
    const md = await fetchText(FEED);
    const section = md.split('## Baseline Results')[1]?.split('\n## ')[0];
    if (!section) throw new Error('FRAMES baseline section missing');
    const model = section.match(/models like ([\w.-]+):/)?.[1];
    if (!model) throw new Error('FRAMES baseline model missing');
    const rows: LeaderboardRow[] = [...section.matchAll(/^- ([^:\n]+):\s*([\d.]+)% accuracy/gm)].map(m=>({model, score:Number(m[2]), setting:m[1]}));
    if (rows.length < 4) throw new Error('FRAMES baseline rows incomplete');
    return rows;
  },
};
export default board;
