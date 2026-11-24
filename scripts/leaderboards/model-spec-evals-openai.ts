// Model Spec Evals measures compliance with OpenAI's behavior specification.
// The evaluation report prints overall compliance percentages. Its chart identifies the May 2024 GPT-4o snapshot.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://openai.com/safety-alignment/model-spec-evals/';
const board: Leaderboard = {
  benchmark: 'model-spec-evals-openai', url: feed, feed,
  terms: 'OpenAI publishes the evaluation report under its site terms at https://openai.com/policies/terms-of-use/.',
  aliases: { 'GPT-4o (May 2024)': 'gpt-4o-may-2024', 'OpenAI o3': 'o3', 'GPT-5 Instant': 'gpt-5-chat',
    'GPT-5 Thinking': 'gpt-5', 'GPT-5.4 Thinking': 'gpt-5-4' },
  stats: { graderSamples: { name: 'Grader samples per response', unit: 'count' } },
  async fetch() {
    const report = text(await fetchText(feed));
    const statement = report.match(/Overall compliance rates are (.*?)\.\s*Model Spec compliance/);
    if (!statement) throw new Error('Overall compliance results missing');
    const rows = [...statement[1].matchAll(/(\d+(?:\.\d+)?)%\s*\(([^)]+)\)/g)].map(([, value, label]) => ({
      model: label === 'GPT-4o' ? 'GPT-4o (May 2024)' : label, score: Number(value), trials: 20, metrics: { graderSamples: 5 },
    }));
    return checked(rows, 6);
  },
};
export default board;
