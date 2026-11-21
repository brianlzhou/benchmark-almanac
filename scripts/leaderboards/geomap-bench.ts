// GeoMap-Bench measures how well models interpret geological maps. The project page ranks methods by Overall.
// The HTML table also reports scores for five kinds of map question.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

interface TableConfig {
  benchmark: string; url: string; feed: string; terms: string;
  model: string; score: string; minimum: number; parts?: Record<string, string>; skip?: string[];
  scale?: number; setting?: string; harness?: string; aliases?: Record<string, string>;
}
export function htmlBoard(config: TableConfig): Leaderboard {
  const { benchmark, url, feed, terms, parts, aliases } = config;
  return {
    benchmark, url, feed, terms, parts, aliases,
    async fetch() {
      const all = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text)));
      const expected = [config.model, config.score, ...Object.values(parts ?? {}), ...[config.setting, config.harness].filter(Boolean)];
      const table = all.find(table => expected.every(col => table[0]?.includes(col!)));
      if (!table) throw new Error(benchmark + ': missing leaderboard columns');
      const head = table[0];
      const rows: LeaderboardRow[] = [];
      for (const cells of table.slice(1)) {
        const get = (key: string) => cells[head.indexOf(key)];
        const model = get(config.model);
        if (!model || config.skip?.includes(model)) continue;
        const score = num(get(config.score));
        if (score === undefined) throw new Error('Missing score for ' + model);
        const row: LeaderboardRow = { model, score: score * (config.scale ?? 1) };
        if (config.setting) row.setting = get(config.setting);
        if (config.harness) row.harness = get(config.harness);
        for (const [key, col] of Object.entries(parts ?? {})) {
          const value = num(get(col));
          if (value !== undefined) (row.metrics ??= {})[key] = value * (config.scale ?? 1);
        }
        rows.push(row);
      }
      if (rows.length < config.minimum) throw new Error(benchmark + ': incomplete leaderboard');
      return rows;
    },
  };
}
export default htmlBoard({
  benchmark: 'geomap-bench', url: 'https://microsoft.github.io/PEACE/#-leaderboard', feed: 'https://microsoft.github.io/PEACE/',
  terms: 'Microsoft cites the MIT repository license. The robots.txt URL serves HTML with no crawler rules.',
  model: 'Method', score: 'Overall', skip: ['Random'], minimum: 2,
  parts: { extracting: 'Extracting', grounding: 'Grounding', referring: 'Referring', reasoning: 'Reasoning', analyzing: 'Analyzing' },
});
