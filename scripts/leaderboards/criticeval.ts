// CriticEval (subjective board). open-compass.github.io/CriticEval renders its subjective leaderboard from
// scores_sub.csv: per model the feedback, correction and comparison scores (GPT-4 judged, 1 to 10) and
// their overall, which is the score. The objective board uses other metrics and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://open-compass.github.io/CriticEval/scores_sub.csv';

const board: Leaderboard = {
  benchmark: 'criticeval',
  url: 'https://open-compass.github.io/CriticEval/leaderboard_subjective.html',
  feed: `${FEED} (overall)`,
  terms: 'CSV on the CriticEval GitHub Pages site that the page loads; the CriticEval repository is Apache-2.0.',
  aliases: {'Llama2-70B-Chat': 'llama-2-70b', 'Llama2-13B-Chat': 'llama-2-13b', 'Llama2-7B-Chat': 'llama-2-7b', 'DeepSeek-67B': 'deepseek-llm-67b'},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.overall);
      if (r.Model && Number.isFinite(score)) rows.push({ model: r.Model.trim(), score, date: '2024-02-21' });
    }
    return rows;
  },
};
export default board;
