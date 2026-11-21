// PitchBench tests perception of musical pitch. Table 1 reports the equal-weight mean only for systems completing all 28 tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/vaclisinc/PitchBench/main/paper/figures-and-tables/table1.csv";

const board: Leaderboard = {
  benchmark: "pitchbench",
  url: "https://github.com/vaclisinc/PitchBench/blob/main/paper/figures-and-tables/table1.md",
  feed,
  terms: "The repository includes an MIT license. The dataset lists CC BY 4.0. https://github.com/vaclisinc/PitchBench/blob/main/LICENSE The feed host returns no robots.txt.",
  aliases: {"openrouter_google_gemini_3_1_pro_preview": "gemini-3-1-pro"},
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    const average = records.find(r => r.task === 'Mean' && r.metric === 'macro_mean');
    if (!average || records.length < 29) throw new Error('Missing complete PitchBench results');
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    for (const [model, cell] of Object.entries(average)) {
      if (model === 'task' || model === 'metric' || cell === '') continue;
      const score = Number.parseFloat(cell), metrics: Record<string, number> = {};
      for (const r of records) {
        if (r === average) continue;
        const value = Number.parseFloat(r[model]);
        if (!Number.isFinite(value)) throw new Error('Missing task for a model with an overall score');
        board.parts[r.task] = r.task;
        metrics[r.task] = value;
      }
      if (!Number.isFinite(score)) throw new Error('Invalid macro mean');
      rows.push({ model, score, metrics });
    }
    if (rows.length < 5) throw new Error('Missing complete systems');
    return rows;
  },
};
export default board;
