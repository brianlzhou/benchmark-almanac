// The Dictatorship Eval (Andrew B. Hall, Stanford GSB and Hoover). dictatoreval.org is a Vite app that loads
// /public_results/chat.json; its resistance_by_level block holds, per level (company and government power)
// and model, passed / total scenarios by scenario type. The board's Overall column is all passed over all
// scenarios in that block ("91.3% 94/103"), reproduced here as a percent. Higher means the model resisted
// more requests that would help concentrate power.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.dictatoreval.org/public_results/chat.json';

interface Data {
  models: string[];
  resistance_by_level: Record<string, Record<string, Record<string, { passed: number; total: number }>>>;
}

const board: Leaderboard = {
  benchmark: 'dictatorship-eval',
  url: 'https://www.dictatoreval.org/',
  feed: `${FEED} (resistance_by_level, passed / total)`,
  terms: 'Public results file the site publishes for its board; dictatoreval.org serves no robots.txt (404) and states no terms.',
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const model of data.models) {
      let passed = 0;
      let total = 0;
      for (const level of Object.values(data.resistance_by_level))
        for (const c of Object.values(level[model] ?? {})) {
          passed += c.passed;
          total += c.total;
        }
      if (total) rows.push({ model, score: (passed / total) * 100 });
    }
    return rows;
  },
};
export default board;
