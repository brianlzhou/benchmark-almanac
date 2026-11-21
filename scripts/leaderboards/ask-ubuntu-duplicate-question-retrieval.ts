// Ask Ubuntu duplicate question retrieval tests whether models rank related questions first.
// MTEB publishes mean average precision at 1,000 on the annotated test set.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/AskUbuntuDupQuestions/scores';
const board: Leaderboard = {
  benchmark:'ask-ubuntu-duplicate-question-retrieval', url:'https://mteb-leaderboard.hf.space/tasks/AskUbuntuDupQuestions', feed, host:'MTEB',
  terms:'MTEB releases the model results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    return checked(await taskScores(feed,'AskUbuntuDupQuestions','map_at_1000',256),256);
  },
};
export default board;
