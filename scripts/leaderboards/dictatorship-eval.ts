// The Dictatorship Eval (Andrew B. Hall, Stanford GSB and Hoover). dictatoreval.org is a Vite app that loads
// /public_results/chat.json; its resistance_by_level block holds, per level (company and government power)
// and model, passed / total scenarios by scenario type. The board's Overall column is all passed over all
// scenarios in that block ("91.3% 94/103"), reproduced here as a percent. Higher means the model resisted
// more requests that would help concentrate power. Keep the corresponding level, scenario and mechanism pass rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.dictatoreval.org/public_results/chat.json';

interface Data {
  models: string[];
  mechanism_breakdown?: Data["resistance_by_level"];
  resistance_by_level: Record<string, Record<string, Record<string, { passed: number; total: number }>>>;
}

const board: Leaderboard = {
  stats: { passed: { name: 'Scenarios passed', unit: 'count', better: 'higher' }, scenarios: { name: 'Scenarios', unit: 'count' } },
  benchmark: 'dictatorship-eval',
  url: 'https://www.dictatoreval.org/',
  feed: `${FEED} (resistance_by_level, passed / total)`,
  terms: 'Public results file the site publishes for its board; dictatoreval.org serves no robots.txt (404) and states no terms.',
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    board.parts = parts;
    for (const model of data.models) {
      let passed = 0;
      let total = 0;
      const metrics: Record<string,number> = {};
      const byType = new Map<string, {passed: number; total: number}>();
      const part = (key: string, name: string, group: string, p: number, n: number) => {
        if (!n) return;
        metrics[key] = 100 * p / n;
        parts[key] = {name, group};
      };
      for (const [id, level] of Object.entries(data.resistance_by_level)) {
        let levelPassed = 0, levelTotal = 0;
        for (const [name,c] of Object.entries(level[model] ?? {})) {
          levelPassed += c.passed;
          levelTotal += c.total;
          const count = byType.get(name) ?? {passed: 0, total: 0};
          count.passed += c.passed;
          count.total += c.total;
          byType.set(name,count);
        }
        passed += levelPassed;
        total += levelTotal;
        part('level' + id, 'Level ' + id, 'Level', levelPassed, levelTotal);
        for (const [name,c] of Object.entries(data.mechanism_breakdown?.[id]?.[model] ?? {})) {
          part(name.split(' ')[0].toLowerCase().replace('.', '_'), name, 'Mechanism', c.passed, c.total);
        }
      }
      for (const [name,c] of byType) {
        const key = name.toLowerCase().replace(/-(.)/g, (_, ch: string) => ch.toUpperCase());
        part(key, name, 'Scenario type', c.passed, c.total);
      }
      if (total) rows.push({model, score: (passed / total) * 100, metrics: {...metrics, passed, scenarios: total}});
    }
    return rows;
  },
};
export default board;
