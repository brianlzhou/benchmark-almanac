// CLUENER2020 evaluates Chinese named entity recognition. The repository's results table reports macro F1 and F1 for each of ten entity types.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/CLUEbenchmark/CLUENER2020/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "cluener2020",
  url: "https://github.com/CLUEbenchmark/CLUENER2020",
  feed: FEED,
  terms: "The publisher displays results at https://github.com/CLUEbenchmark/CLUENER2020. I could not verify reuse terms. GitHub requests a one-second crawl delay.",
  parts: {
    'Person Name': { name: 'Person name', group: 'Entity type' },
    Organization: { name: 'Organization', group: 'Entity type' },
    Position: { name: 'Position', group: 'Entity type' },
    Company: { name: 'Company', group: 'Entity type' },
    Address: { name: 'Address', group: 'Entity type' },
    Game: { name: 'Game', group: 'Entity type' },
    Government: { name: 'Government', group: 'Entity type' },
    Scene: { name: 'Scene', group: 'Entity type' },
    Book: { name: 'Book', group: 'Entity type' },
    Movie: { name: 'Movie', group: 'Entity type' },
  },
  async fetch() {
    const tables = markdownTables(await fetchText(FEED));
    const head = tables.find((t) => t[0][1] === '线上效果f1');
    const parts = tables.find((t) => t[0][0] === '实体');
    if (!head || head.length < 4 || !parts || parts.length < 12) throw new Error('Incomplete CLUENER tables');
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categories = parts.slice(1).filter(([name]) => name !== 'Overall@Macro');
    return head.slice(1).map(([model, value]) => {
      const index = parts[0].findIndex((name) => normalize(name) === normalize(model));
      if (index < 1 || !value || !Number.isFinite(Number(value))) throw new Error(`Incomplete score for ${model}`);
      const metrics = Object.fromEntries(categories.map((row) => {
        if (!row[index] || !Number.isFinite(Number(row[index]))) throw new Error(`Missing ${row[0]} for ${model}`);
        return [row[0], Number(row[index])];
      }));
      return { model, score: Number(value), metrics };
    });
  },
};
export default board;
