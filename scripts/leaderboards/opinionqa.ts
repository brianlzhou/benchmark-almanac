// OpinionQA compares model opinion distributions with the population of survey respondents.
// Figure 2 reports overall representativeness. Higher scores indicate closer agreement.
// The figure's numeric labels were transcribed twice and compared. The PDF's SHA-256 guards the transcription.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://proceedings.mlr.press/v202/santurkar23a/santurkar23a.pdf';
const board: Leaderboard = {
  benchmark: 'opinionqa', static: 'paper', feed, url: 'https://proceedings.mlr.press/v202/santurkar23a.html',
  terms: 'Proceedings of Machine Learning Research publishes this ICML paper. https://proceedings.mlr.press/v202/santurkar23a.html',
  aliases: { davinci: 'gpt-3-175b-davinci', 'text-davinci-002': 'davinci-002', 'text-davinci-003': 'davinci-003' },
  async fetch() {
    return checked(await chartRows(feed, '4981d916f369b1019d38940f02cd219d2f83ba9e85326fc377e00e2a75720892', [
      { model: 'j1-grande', score: 0.813 }, { model: 'j1-jumbo', score: 0.816 },
      { model: 'j1-grande-v2-beta', score: 0.804 }, { model: 'ada', score: 0.824 },
      { model: 'davinci', score: 0.791 }, { model: 'text-ada-001', score: 0.707 },
      { model: 'text-davinci-001', score: 0.714 }, { model: 'text-davinci-002', score: 0.763 },
      { model: 'text-davinci-003', score: 0.700 },
    ]), 9);
  },
};
export default board;
