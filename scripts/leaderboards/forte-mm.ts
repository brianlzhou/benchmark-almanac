// FORTE-MM ranks models by average accuracy across three attempts in its published Markdown table.
// The table distinguishes pass@3 from pass^3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/AGI-Eval-Official/FORTE-MM/HEAD/docs/leaderboard.md";

const board: Leaderboard = {
  benchmark: "forte-mm",
  url: "https://github.com/AGI-Eval-Official/FORTE-MM/blob/main/docs/leaderboard.md",
  feed,
  terms: "The report is public. Results licensing remains unverified at https://github.com/AGI-Eval-Official/FORTE-MM. The raw file host returns 404 for robots.txt.",
  stats: {
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher', note: 'Percentage of tasks with at least one successful run among three runs.' },
    pass3: { name: 'Pass^3', unit: '%', better: 'higher', note: 'Percentage of tasks with three successful runs out of three.' },
  },
  aliases: { 'claude-5-opus': 'claude-opus-5', 'claude-4.8-opus': 'claude-opus-4-8', 'deepseek-4.1-flash': 'deepseek-v4-1-flash' },
  async fetch() {
    const expected = ["Rank", "Model", "Avg@3", "Pass@3", "Pass^3"];
    const table = markdownTables(await fetchText(feed)).find(t => expected.every((v, i) => t[0]?.[i] === v));
    if (!table || table.length <= 8) throw new Error('Missing forte-mm results or columns');
    return table.slice(1).map(r => {
      const numeric = (i: number) => {
        const value = Number(r[i]?.replace(/[%,$]/g, ''));
        if (!r[i]?.trim() || !Number.isFinite(value)) throw new Error('Invalid score for ' + r[1]);
        return value;
      };
      return { model: r[1], score: numeric(2), metrics: { "passAt3": numeric(3), "pass3": numeric(4) }, trials: 3 };
    });
  },
};

export default board;
