// FiVE-Bench ranks video editors by FiVE-Acc. The Space reads one evaluation file per editor and publishes the original videos as a baseline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://huggingface.co/api/spaces/LIMinghan/FiVE-Bench-leaderboard/tree/main/eval-results";

const board: Leaderboard = {
  benchmark: "five-bench-video-editing",
  url: "https://huggingface.co/spaces/LIMinghan/FiVE-Bench-leaderboard",
  feed,
  terms: "The authors label the leaderboard Space MIT. https://huggingface.co/spaces/LIMinghan/FiVE-Bench-leaderboard/blob/main/README.md Hugging Face allows these files in robots.txt.",
  async fetch() {
    const files = await fetchJson<{ path: string; type: string }[]>(feed);
    const rows: LeaderboardRow[] = [];
    for (const file of files.filter(f => f.type === 'file' && f.path.endsWith('.json') && !f.path.includes('/Source_videos_'))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const link = 'https://huggingface.co/spaces/LIMinghan/FiVE-Bench-leaderboard/raw/main/' + file.path;
      const { config, results } = await fetchJson<{ config: { model: string }; results: Record<string, Record<string, number>> }>(link);
      const score = results.vlm_accuracy?.five_acc;
      if (!config.model || !Number.isFinite(score)) throw new Error('Invalid FiVE evaluation: ' + file.path);
      const metrics: Record<string, number> = {};
      for (const [group, values] of Object.entries(results)) {
        for (const [key, value] of Object.entries(values)) if (Number.isFinite(value)) metrics[group + '_' + key] = value;
      }
      rows.push({ model: config.model, score, link, metrics });
    }
    if (rows.length < 7) throw new Error('Missing FiVE editors');
    return rows;
  },
};

export default board;
