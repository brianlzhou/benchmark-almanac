// KARLBench tests knowledge agents across six grounded reasoning tasks.
// The score is the paper's Total column, the mean across BrowseComp-Plus, TREC-Biogen, FreshStack, FinanceBench, QAMPARI and PMBench.
// This importer reads Table 4 from the Databricks report and keeps every task score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://www.databricks.com/karl.pdf';
const TASKS = ['browseCompPlus', 'trecBiogen', 'freshStack', 'financeBench', 'qampari', 'pmBench'];
const values: [string, number[], string?][] = [
  ['GLM 4.5 Air', [44.7, 66.0, 52.9, 72.7, 45.9, 33.4]], ['Qwen 3.5 397B A17B', [55.8, 68.2, 51.9, 79.3, 42.8, 34.7]], ['Minimax m2.5', [56.5, 69.3, 53.3, 78.0, 39.3, 34.5]], ['GPT 5', [68.3, 68.2, 55.6, 86.7, 44.4, 37.5]], ['GPT 5.2', [47.8, 62.0, 47.9, 80.3, 41.1, 37.9]], ['Claude 4.5 Haiku', [45.8, 72.4, 48.7, 73.7, 48.0, 35.0]], ['Claude 4.5 Sonnet', [54.6, 75.2, 55.0, 79.3, 54.8, 32.6]], ['Claude 4.5 Opus', [62.5, 74.7, 57.4, 80.7, 54.9, 39.1]], ['Claude 4.6 Sonnet', [57.9, 77.7, 62.6, 81.3, 50.2, 43.8]], ['Claude 4.6 Opus', [75.9, 79.9, 61.4, 83.0, 58.6, 46.1]],
  ['KARL-TREC', [42.2, 85.0, 56.7, 68.3, 50.8, 37.5], 'single-task RL'], ['KARL-BCP', [59.6, 68.0, 51.6, 77.0, 44.1, 32.4], 'single-task RL'], ['KARL', [58.5, 80.2, 55.2, 76.0, 47.8, 35.7], 'multi-task RL'], ['KARL', [62.2, 83.7, 57.7, 80.8, 55.1, 44.8], 'parallel N = 3'], ['KARL', [67.5, 86.7, 58.6, 84.5, 59.7, 47.8], 'parallel N = 10'],
];

const board: Leaderboard = {
  benchmark: 'karlbench', static: 'paper', url: FEED, feed: FEED,
  terms: 'Databricks publishes this report for reading and citation. https://www.databricks.com/karl.pdf',
  parts: Object.fromEntries(TASKS.map((name) => [name, { name, group: 'Task', unit: '%' }])),
  async fetch() {
    const text = await pdfText(FEED);
    if (!text.includes('KARLBench') || !text.includes('BrowseComp-Plus') || !text.includes('KARL (par. N = 10)')) throw new Error('KARLBench Table 4 missing');
    return checked(values.map(([model, scores, setting]) => ({ model, setting, score: scores.reduce((sum, value) => sum + value, 0) / scores.length, metrics: Object.fromEntries(TASKS.map((task, index) => [task, scores[index]])) })), 15);
  },
};

export default board;
