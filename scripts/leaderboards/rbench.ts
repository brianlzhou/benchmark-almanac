// RBench (robot video generation, DAGroup-PKU). The Hugging Face Space DAGroup-PKU/RBench-Leaderboard (MIT)
// draws its default table from leaderboard.json in the Space repository: per model an "avg" (0 to 1) and
// per-task and per-embodiment scores, judged by a GPT model. leaderboard_qwen.json holds the same board
// judged by Qwen, which gives different scores and order, and is not read. The score is avg x 100 (the
// file mixes numbers and numeric strings).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/DAGroup-PKU/RBench-Leaderboard/resolve/main/leaderboard.json';

const board: Leaderboard = {
  benchmark: 'rbench',
  url: 'https://huggingface.co/spaces/DAGroup-PKU/RBench-Leaderboard',
  feed: `${FEED} (avg)`,
  terms: 'File in a public Hugging Face Space licensed MIT.',
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ model: string; avg: number | string }[]>(FEED);
    return data.map((r) => ({ model: r.model, score: Number(r.avg) * 100 }));
  },
};
export default board;
