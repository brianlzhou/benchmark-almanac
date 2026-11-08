// Arena's Text-to-Video Arena, read through Arena's Hugging Face dataset: its "text_to_video" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts.
// Arena's snapshot of 2026-11-06 switched this subset from model slugs ("wan2.6-t2v", "kling-v2.1-master") to
// display names ("Wan 2.6", "Kling 2.1 Master"). VIDEO_ALIASES keeps each name on the model it matched before.
// The registry keeps separate text-to-video and image-to-video models for Wan, Kandinsky and Mochi.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const VIDEO_ALIASES: Record<string, string> = {
  'Kling 2.1 Master': 'kling-v2-1-master',
  'Pika 2.2': 'pika-v2-2',
  'Luma Ray3': 'ray-3',
  'Luma Ray2': 'ray2',
  'Seedance 1.5 Pro': 'seedance-v1-5-pro',
  'Seedance 1.0 Pro': 'seedance-v1-pro',
  'Seedance 1.0 Lite': 'seedance-v1-lite',
  'Kandinsky 5.0 Video Pro': 'kandinsky-5-0-t2v-pro',
  'Kandinsky 5.0 Video Lite': 'kandinsky-5-0-t2v-lite',
  'Mochi 1': 'mochi-v1',
  'Wan 2.5 Preview': 'wan2-5-t2v-preview',
  'Wan 2.6': 'wan2-6-t2v',
  'Wan 2.7': 'wan2-7-t2v',
};

const board: Leaderboard = {
  benchmark: 'lmarena-text-to-video',
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('text_to_video'),
  terms: ARENA_TERMS,
  aliases: { ...ARENA_ALIASES, ...VIDEO_ALIASES },
  fetch: () => arenaRows('text_to_video'),
};
export default board;
