// Sherlock Holmes Q&A tests agentic retrieval over 55 Project Gutenberg stories.
// The score is the percentage of 20 questions answered correctly under the listed model run.
// This importer reads the environment README's Benchmark Results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/DerOeko/prime-environments/gutenberg_env/environments/gutenberg_env/README.md';

const board: Leaderboard = {
  benchmark: 'sherlock-holmes-qa-gutenberg',
  url: 'https://github.com/DerOeko/prime-environments/tree/gutenberg_env/environments/gutenberg_env',
  feed,
  terms: 'The source README is published in the Prime Environments repository under its repository license. https://github.com/DerOeko/prime-environments/blob/gutenberg_env/LICENSE',
  async fetch() {
    const source = await fetchText(feed);
    const section = source.split('## Benchmark Results')[1]?.split('## Design Choices')[0];
    if (!section) throw new Error('Missing Sherlock benchmark results section');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      if (!line.trim().startsWith('|') || line.includes('---') || /Model\s*\|/i.test(line)) continue;
      const cells = line.trim().split('|').slice(1).map(cell => cell.trim());
      if (cells.length < 2) continue;
      const score = Number(cells[1].replace('%', '').trim());
      if (!cells[0] || !Number.isFinite(score)) continue;
      const calls = Number(cells[2]);
      rows.push({ model: cells[0], score, trials: 20, ...(Number.isFinite(calls) ? { metrics: { averageToolCalls: calls } } : {}) });
    }
    if (rows.length !== 5) throw new Error(`Expected five Sherlock benchmark rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
