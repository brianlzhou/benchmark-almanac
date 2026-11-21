// The Illusion of AI Safety tests harmful responses to self-harm, eating-disorder, and substance-use prompts.
// The headline score is the report's harmful-content rate, where lower is better.
// The report's main comparison table contains four repeated runs per model and 120 responses per model.
import type { Leaderboard } from './types.ts';
const board: Leaderboard = {
  benchmark: 'ccdh-illusion-of-ai-safety', static: 'paper', url: 'https://www.counterharm.com/research/the-illusion-of-ai-safety',
  feed: 'https://counterhate.com/wp-content/uploads/2025/10/ChatGPT-The-Illusion-of-AI-Safety_FINAL_Oct25.pdf',
  terms: 'The report is publicly available from the Center for Countering Digital Hate. Source attribution applies.',
  async fetch() { return [
    { model: 'GPT-4o', score: 43, trials: 120, metrics: { harmfulResponses: 52, safeResponses: 68 } },
    { model: 'GPT-5', score: 53, trials: 120, metrics: { harmfulResponses: 63, safeResponses: 57 } },
  ]; },
};
export default board;
