// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// PlanBench scores the percentage of planning problems solved in each domain on its static zero-shot test set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/karthikv792/LLMs-Planning/HEAD/README.md';
const parts = { blocksworld: 'Blocksworld', mystery: 'Mystery Blocksworld', randomized: 'Randomized Mystery Blocksworld', hard: 'Blocksworld Hard' };
const board: Leaderboard = {
  benchmark: 'planbench', url: 'https://github.com/karthikv792/LLMs-Planning#planbench-static-test-set-leaderboard', feed, parts,
  // The April 2025 board already contains this row, before the May R1 release.
  aliases: { 'Deepseek R1 (snapshot unspecified)': 'deepseek-r1' },
  terms: 'MIT license. https://github.com/karthikv792/LLMs-Planning/blob/HEAD/LICENSE',
  headline: 'The board reports no overall score, so the headline is the plain mean of its four domain success rates.',
  async fetch() {
    const text = (await fetchText(feed)).split('# PlanBench Static Test Set Leaderboard')[1]?.split('## Submitting')[0];
    const lines = text?.split('\n').filter(line => line.startsWith('|'));
    const cells = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());
    if (!lines || cells(lines[0]).slice(2).map(c => c.split(' - ')[0]).join() !== Object.values(parts).join()) throw new Error('Missing domain columns');
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(2)) {
      const [model, , ...values] = cells(line);
      if (values.length !== 4 || values.some(v => v !== '-' && !/^\d+(\.\d+)?%$/.test(v))) throw new Error('Invalid domain results');
      if (values.includes('-')) continue;
      const scores = values.map(parseFloat);
      rows.push({ model, setting: 'Zero-shot', score: scores.reduce((a, b) => a + b) / 4,
        metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, scores[i]])) });
    }
    return checked(rows, 3);
  },
};
export default board;
