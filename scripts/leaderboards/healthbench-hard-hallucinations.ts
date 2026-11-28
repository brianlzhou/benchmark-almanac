// HealthBench Hard Hallucinations measures error rate on physician-validated health conversations.
// Figure 7 in the GPT-5 system card prints the error percentage above each bar.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://cdn.openai.com/gpt-5-system-card.pdf';
const digest = 'f9f9c72d08cba81dcbb189129119357c8c32eca4e0b16c813aca386aed6b0459';
export default {
  benchmark: 'healthbench-hard-hallucinations', static: 'paper', url: feed, feed,
  terms: 'OpenAI publishes this system card on its public CDN, which serves no robots.txt.',
  aliases: { 'gpt-5-thinking': 'gpt-5', 'gpt-5-thinking-mini': 'gpt-5-mini', 'gpt-5-main': 'gpt-5-chat',
    'OpenAI o3': 'o3', 'OpenAI o4-mini': 'o4-mini', 'OpenAI o1': 'o1' },
  fetch: () => chartRows(feed, digest, [
    { model: 'gpt-5-thinking', score: 1.6 },
    { model: 'OpenAI o3', score: 12.9 },
    { model: 'gpt-5-thinking-mini', score: 3.8 },
    { model: 'OpenAI o4-mini', score: 11.9 },
    { model: 'OpenAI o1', score: 11.1 },
    { model: 'gpt-5-main', score: 3.6 },
    { model: 'gpt-4o', score: 15.8 },
  ]),
} satisfies Leaderboard;
