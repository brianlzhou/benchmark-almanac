// Slop Score on eqbench.com (lower is better). slop-score.html loads data/leaderboard_results.json, per-model
// text metrics, and computes the score in the page: each of slop-list words per 1k words, slop trigrams per
// 1k words and "not x but y" contrasts per 1k characters is scaled to 0 to 1 over the range of all models
// (widened by 10% at each end), then weighted 60%, 15% and 25% and times 100. That formula is reproduced here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS } from './creative-writing-v3.ts';

const FEED = 'https://eqbench.com/data/leaderboard_results.json';

interface Result {
  model: string;
  metrics: { slop_list_matches_per_1k_words?: number; slop_trigram_matches_per_1k_words?: number; not_x_but_y_per_1k_chars?: number };
}

const board: Leaderboard = {
  benchmark: 'slop-score',
  url: 'https://eqbench.com/slop-score.html',
  feed: FEED,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  async fetch() {
    const { results } = await fetchJson<{ results: Result[] }>(FEED);
    const range = (vals: number[]) => {
      const [min, max] = [Math.min(...vals), Math.max(...vals)];
      return { min: min - (max - min) * 0.1, max: max + (max - min) * 0.1 };
    };
    const words = results.map((r) => r.metrics.slop_list_matches_per_1k_words || 0);
    const trigrams = results.map((r) => r.metrics.slop_trigram_matches_per_1k_words || 0);
    const contrast = results.map((r) => r.metrics.not_x_but_y_per_1k_chars || 0);
    const [w, t, c] = [range(words), range(trigrams), range(contrast)];
    const norm = (v: number, r: { min: number; max: number }) => Math.max(0, Math.min(1, (v - r.min) / (r.max - r.min)));
    const rows: LeaderboardRow[] = results.map((r, i) => ({
      model: r.model,
      score: (norm(words[i], w) * 0.6 + norm(contrast[i], c) * 0.25 + norm(trigrams[i], t) * 0.15) * 100,
    }));
    if (!rows.length) throw new Error('no results in leaderboard_results.json');
    return rows;
  },
};
export default board;
