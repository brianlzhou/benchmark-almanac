// Kinetics-400 tests recognition of human actions in video clips.
// MTEB reports accuracy on its Kinetics400VA audio-video sample, with up to
// ten test clips per class. Convert the reported fraction to a percentage.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const task = 'Kinetics400VA';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/Kinetics400VA/scores';
export default {
  benchmark: 'kinetics-400', url: 'https://leaderboard.mteb.org/tasks/' + task, feed, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0 at https://huggingface.co/datasets/mteb/results',
  headline: 'MTEB measures audio-video classification accuracy on its Kinetics400VA sample, with up to ten test clips per class.',
  stats: {activeParamsB:{name:'Active parameters',unit:'billions'},embeddingDim:{name:'Embedding dimension',unit:'count'},maxTokens:{name:'Maximum tokens',unit:'tokens'},memoryUsageMb:{name:'Memory usage',unit:'count',note:'Memory usage in megabytes.'}},
  aliases: {'Qwen/Qwen2.5-Omni-7B': 'qwen2-5-omni-7b'},
  async fetch() {
    const rows = await taskScores(feed, task, 'accuracy', 16, 100);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 16);
  },
} satisfies Leaderboard;
