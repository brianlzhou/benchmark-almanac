// Mosaic Eval Gauntlet measures language-model capability across six core competency groups.
// The headline is the source's Core Average, with the five published component columns retained.
// This importer reads the Databricks model evaluation table in the repository README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/databricks/databricks-ml-examples';
const feed = 'https://raw.githubusercontent.com/databricks/databricks-ml-examples/master/README.md';
const board: Leaderboard = {
  benchmark: 'mosaic-eval-gauntlet-v0-3-0', url, feed,
  terms: 'Databricks publishes the README table under the repository license. https://github.com/databricks/databricks-ml-examples/blob/master/LICENSE',
  parts: {
    worldKnowledge: { name: 'World knowledge', group: 'Competency' },
    commonsenseReasoning: { name: 'Commonsense reasoning', group: 'Competency' },
    languageUnderstanding: { name: 'Language understanding', group: 'Competency' },
    symbolicProblemSolving: { name: 'Symbolic problem solving', group: 'Competency' },
    readingComprehension: { name: 'Reading comprehension', group: 'Competency' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const start = text.indexOf('| Model Name');
    if (start < 0) throw new Error('Mosaic Eval Gauntlet table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of text.slice(start).split('\n').slice(2)) {
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
      if (cells.length < 7 || !/^\[.+\]\(/.test(cells[0])) break;
      const model = cells[0].replace(/^\[|\].*$/g, '');
      const nums = cells.slice(1, 7).map(Number);
      if (!nums.every(Number.isFinite)) throw new Error('Invalid Mosaic Eval Gauntlet row');
      rows.push({ model, score: nums[0], metrics: { worldKnowledge: nums[1], commonsenseReasoning: nums[2], languageUnderstanding: nums[3], symbolicProblemSolving: nums[4], readingComprehension: nums[5] } });
    }
    if (rows.length < 2) throw new Error('Mosaic Eval Gauntlet rows missing');
    return rows;
  },
};
export default board;
