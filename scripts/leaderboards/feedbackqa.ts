// FeedbackQA tests retrieval of relevant passages for user questions. The MTEB
// board reports precision at one, converted to the percent of correct first hits.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/FeedbackQARetrieval/scores';
export default {
  benchmark: 'feedbackqa', feed, url:'https://mteb-leaderboard.hf.space/tasks/FeedbackQARetrieval', host:'MTEB',
  terms:'MTEB releases these scores under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    return checked(await taskScores(feed,'FeedbackQARetrieval','precision_at_1',15,100),15);
  },
} satisfies Leaderboard;
