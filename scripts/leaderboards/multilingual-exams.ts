// Multilingual Exams: Qwen's release report publishes Multi-Exam accuracy in its base-model tables.
// Read the Multi-Exam row across model columns, as percentages. Base models stay distinct from chat models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://qwenlm.github.io/blog/qwen2.5-llm/';
const board: Leaderboard = {
  benchmark: 'multilingual-exams', url: FEED, feed: FEED,
  terms: 'Public Qwen release-report tables, attributed to the Qwen authors; no separate results license is stated.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const scores = t.find(r => r[0]?.text === 'Multi-Exam');
      if (!scores) continue;
      for (let i = 1; i < scores.length; i++) {
        const score = num(scores[i].text), model = t[0]?.[i]?.text;
        if (model && score !== undefined) rows.push({model: `${model} (base)`, score, setting: 'base model; Qwen2.5 release evaluation'});
      }
    }
    if (!rows.length) throw new Error('No Multi-Exam rows');
    return rows;
  },
};
export default board;
