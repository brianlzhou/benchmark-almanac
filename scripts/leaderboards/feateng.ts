// FeatEng asks language models to write Python feature transformations for 103 tabular datasets.
// The score is the percentage improvement from the generated features, with the paper's uncertainty interval.
// This importer reads the fixed results table in Table 1 of the paper's HTML rendering.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const PAGE = 'https://arxiv.org/html/2410.23331#S3.T1';
const FEED = 'https://arxiv.org/html/2410.23331';

const board: Leaderboard = {
  benchmark: 'feateng',
  url: PAGE,
  feed: `${FEED} (Table 1, FeatEng results)`,
  terms: 'The paper publishes this fixed results table under the arXiv terms. Results are credited to the FeatEng authors.',
  static: 'paper',
  parts: {
    classification: { name: 'Classification', group: 'Task type', note: 'The paper reports this score on classification datasets.' },
    regression: { name: 'Regression', group: 'Task type', note: 'The paper reports this score on regression datasets.' },
    failed: { name: 'Failure', group: 'Task type', note: 'The paper reports the fraction of failed runs.' },
    improvedClassification: { name: 'Improved classification', group: 'Task type', note: 'The paper reports this score on classification datasets after feature engineering.' },
    improvedRegression: { name: 'Improved regression', group: 'Task type', note: 'The paper reports this score on regression datasets after feature engineering.' },
    best: { name: 'Best', group: 'Task type', note: 'The paper reports the best result across the task types.' },
  },
  async fetch() {
    const table = inlinePaperTables(await fetchText(FEED)).find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'FeatEng');
    if (!table) throw new Error('FeatEng: results table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      if (cells.length < 9 || !cells[0] || cells[0] === '(AutoML)') continue;
      const scoreMatch = cells[1].match(/-?\d+(?:\.\d+)?/);
      const intervalMatch = cells[1].match(/±\\?\s*(-?\d+(?:\.\d+)?)/);
      if (!scoreMatch) throw new Error(`FeatEng: score missing for ${cells[0]}`);
      const score = Number(scoreMatch[0]);
      const metrics: Record<string, number> = {};
      for (const [key, index] of [['classification', 3], ['regression', 4], ['failed', 5], ['improvedClassification', 6], ['improvedRegression', 7], ['best', 8]] as const) {
        const value = Number(cells[index]);
        if (Number.isFinite(value)) metrics[key] = value;
      }
      rows.push({ model: cells[0], score, ...(intervalMatch ? { low: score - Number(intervalMatch[1]), high: score + Number(intervalMatch[1]) } : {}), metrics });
    }
    if (rows.length !== 23) throw new Error(`FeatEng: ${rows.length} model rows, expected 23`);
    return rows;
  },
};

export default board;
