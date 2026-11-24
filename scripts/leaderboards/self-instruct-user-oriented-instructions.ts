// Figure 6 tests whether models follow 252 user instructions. The authors count ratings A and B as acceptable.
// The headline is the percentage of acceptable responses. Each rating count comes from two matching chart transcriptions.
// The PDF hash guards the transcription because its text layer contains overlapping chart labels.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.acl-long.754.pdf';
const counts: [string, number, number, number, number][] = [
  ['Vanilla GPT3', 0, 1, 64, 187],
  ['GPT3+T0 Training', 44, 31, 59, 118],
  ['GPT3+SuperNI Training', 74, 30, 80, 68],
  ['GPT3 Self-Inst+SuperNI', 83, 54, 84, 31],
  ['GPT3 Self-Inst', 112, 49, 66, 25],
  ['InstructGPT 001', 128, 45, 61, 18],
  ['InstructGPT 002', 168, 40, 34, 10],
  ['InstructGPT 003', 192, 30, 28, 2],
];
const board: Leaderboard = {
  benchmark: 'self-instruct-user-oriented-instructions', static: 'paper', url: 'https://aclanthology.org/2023.acl-long.754/', feed,
  terms: 'ACL Anthology copyright and licensing terms apply. https://aclanthology.org/info/copyright/',
  aliases: {'Vanilla GPT3': 'gpt-3-175b-davinci', 'InstructGPT 002': 'davinci-002', 'InstructGPT 003': 'davinci-003'},
  headline: 'The score is the percentage of 252 instructions that received an acceptable response (rating A or B).',
  stats: {
    ratingA: { name: 'Rating A responses', unit: 'count', better: 'higher', note: 'Valid and satisfying responses out of 252 instructions.' },
    ratingB: { name: 'Rating B responses', unit: 'count', note: 'Acceptable responses with minor errors or imperfections out of 252 instructions.' },
    ratingC: { name: 'Rating C responses', unit: 'count', better: 'lower', note: 'Relevant responses with significant errors out of 252 instructions.' },
    ratingD: { name: 'Rating D responses', unit: 'count', better: 'lower', note: 'Irrelevant or invalid responses out of 252 instructions.' },
  },
  async fetch() {
    const rows = counts.map(([model, ratingA, ratingB, ratingC, ratingD]) => {
      if (ratingA + ratingB + ratingC + ratingD !== 252) throw new Error('Incomplete ratings for ' + model);
      return {model, score: (ratingA + ratingB) * 100 / 252, metrics: {ratingA, ratingB, ratingC, ratingD}};
    });
    return checked(await chartRows(feed, '87f1d8476fa041d0c6b09b9239253ed698c4efac973347aebe83c487eab91c78', rows), 8);
  },
};
export default board;
