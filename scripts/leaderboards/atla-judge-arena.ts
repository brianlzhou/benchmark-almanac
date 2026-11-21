// Atla’s Judge Arena ranks model judges by Elo from anonymous pairwise votes.
// The Space publishes the final ratings, vote counts and confidence intervals in a static JSON file.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/AtlaAI/judge-arena";
const feed = "https://huggingface.co/spaces/AtlaAI/judge-arena/resolve/main/data/leaderboard_static.json";

const board: Leaderboard = {
  benchmark: 'atla-judge-arena', url, feed,
  terms: "The Space does not state a license for the leaderboard results. https://huggingface.co/spaces/AtlaAI/judge-arena/blob/main/README.md" ,
  aliases: {
    'Meta Llama 3.3 70B Instruct Turbo': 'llama-3-3-70b-instruct',
    'Qwen 2.5 72B Instruct Turbo': 'qwen2-5-72b',
    'Qwen 2 Instruct (72B)': 'qwen2-72b',
  },
  async fetch() {
    type Entry = {Model: string; 'ELO Score': number; '95% CI': string; '# Votes': number; License: string};
    const data = await fetchJson<{last_updated: string; total_models: number; leaderboard: Entry[]}>(feed);
    if (data.total_models < 28 || data.total_models !== data.leaderboard.length) throw new Error('Incomplete Judge Arena ranking');
    return data.leaderboard.map(r => {
      const ci = r['95% CI']?.match(/^±(\d+)$/);
      const score = r['ELO Score'];
      if (!ci || !r.Model || !Number.isFinite(score) || !Number.isFinite(r['# Votes']) || !r.License) throw new Error('Invalid Judge Arena row');
      const half = Number(ci[1]);
      return { model:r.Model, score, low:score-half, high:score+half, metrics:{votes:r['# Votes']},
        open:r.License === 'Open Source', date:new Date(data.last_updated + ' UTC').toISOString().slice(0,10) };
    });
  },
};
export default board;
