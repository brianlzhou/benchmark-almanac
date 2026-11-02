// StructEval (TIGER-Lab). The project page reads static/data/leaderboard.json: one result per model with
// release date, judge, run notes and a metrics object whose "overall" (mean over all 2,035 examples, 0 to
// 100) is the ranking and the score. Only complete runs are read. The evaluation date is the row date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://tiger-ai-lab.github.io/StructEval/static/data/leaderboard.json';

interface Result {
  name: string;
  model_key?: string;
  complete?: boolean;
  evaluated_on?: string;
  release_date?: string;
  metrics?: { overall?: number };
}

const board: Leaderboard = {
  benchmark: 'structeval',
  url: 'https://tiger-ai-lab.github.io/StructEval/',
  feed: `${FEED} (metrics.overall)`,
  terms: 'JSON file on the StructEval GitHub Pages site that the page loads; the page content is CC BY-SA 4.0.',
  aliases: {
    'Qwen3 30B A3B Instruct 2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Gemma 4 26B A4B IT': 'gemma-4-26b-a4b',
    'Llama 3.1 8B Instruct': 'llama-3-1-8b',
    'Llama 3 8B Instruct': 'llama-3-8b',
  },
  async fetch() {
    const { results } = await fetchJson<{ results: Result[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of results) {
      const score = r.metrics?.overall;
      if (!r.name || r.complete === false || typeof score !== 'number') continue;
      rows.push({ model: r.name.trim(), score, date: r.release_date ?? r.evaluated_on });
    }
    return rows;
  },
};
export default board;
