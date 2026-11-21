// Redtape tests whether language models abstain when a requested fact is missing.
// The corrected corpus's primary score is abstention accuracy, with intervals in the same score unit.
// This importer reads the authors' corrected-results table in the repository README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/JakPot42/redtape/main/README.md';
const board: Leaderboard = {
  benchmark: 'redtape',
  url: 'https://github.com/JakPot42/redtape',
  feed: FEED,
  terms: 'The authors publish the repository under its stated license. Cite the repository and follow its terms. https://github.com/JakPot42/redtape',
  stats: { correct: { name: 'Correct abstention decisions', unit: 'count' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const table = source.match(/\| \| Claude Opus 5 \| GPT-5\.6 Sol \|([\s\S]*?)\n\n/)?.[1];
    if (!table) throw new Error('Redtape corrected results table missing');
    const match = table.match(/\| abstention accuracy \| ([\d.]+) \((\d+)\/(\d+)\) \[([\d.]+), ([\d.]+)\] \| \*\*([\d.]+)\*\* \((\d+)\/(\d+)\) \[([\d.]+), ([\d.]+)\] \|/);
    if (!match) throw new Error('Redtape abstention row missing');
    const [, opus, opusCorrect, opusTotal, opusLow, opusHigh, gpt, gptCorrect, gptTotal, gptLow, gptHigh] = match;
    const rows: LeaderboardRow[] = [
      { model: 'Claude Opus 5', score: Number(opus), low: Number(opusLow), high: Number(opusHigh), trials: Number(opusTotal), metrics: { correct: Number(opusCorrect) } },
      { model: 'GPT-5.6 Sol', score: Number(gpt), low: Number(gptLow), high: Number(gptHigh), trials: Number(gptTotal), metrics: { correct: Number(gptCorrect) } },
    ];
    const third = source.match(/\| abstention accuracy \| 0\.745 \((\d+)\/(\d+)\) \[([\d.]+), ([\d.]+)\] \|/);
    if (third) rows.push({ model: 'Claude Opus 5.5', score: 0.745, low: Number(third[3]), high: Number(third[4]), trials: Number(third[2]), metrics: { correct: Number(third[1]) } });
    return checked(rows, 3);
  },
};
export default board;
