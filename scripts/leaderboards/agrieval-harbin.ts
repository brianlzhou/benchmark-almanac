// AgriEval measures language-model performance on Chinese agricultural cognitive questions.
// The zero-shot Table 2 overall column is the headline, with cognitive task scores kept as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2507.21773';
const board: Leaderboard = {
  benchmark: 'agrieval-harbin', static: 'paper',
  url: 'https://arxiv.org/abs/2507.21773', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2507.21773',
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[0] === 'Model' && t[0]?.at(-1) === 'Overall' && t[1]?.[1] === 'M-P');
    if (!table) throw new Error('AgriEval zero-shot table missing');
    const rows = table.slice(2).map((row) => ({
      model: row[0], score: Number(row.at(-1)), metrics: {
        memorizationPrinciples: Number(row[1]), memorizationReasoning: Number(row[2]), memorizationExamples: Number(row[3]), memorizationTerminology: Number(row[4]),
        understandingInterpretation: Number(row[5]), understandingScience: Number(row[6]), understandingVocabulary: Number(row[7]), inferenceDeduction: Number(row[8]), inferenceNumerical: Number(row[9]), inferencePractical: Number(row[10]), inferenceScenario: Number(row[11]), inferenceGeneralization: Number(row[12]),
      },
    }));
    return checked(rows, 30);
  },
};
export default board;
