// BabyAI tests whether agents follow language instructions in a grid world.
// AgentBoard reports success across its 112 BabyAI episodes, with progress and grounding rates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://hkust-nlp.github.io/agentboard/data/To_Release/main_data_new.json';
type Entry = { model: string, tasks: { BabyAI: { accuracy: string, score: string, grounding: string } } };
function percent(cell: string) {
  if (!/^\d+(\.\d+)?%$/.test(cell)) throw new Error('Missing BabyAI percentage');
  return parseFloat(cell);
}
const board: Leaderboard = {
  benchmark: 'babyai', host: 'AgentBoard', url: 'https://hkust-nlp.github.io/agentboard/static/leaderboard.html', feed,
  terms: 'AgentBoard publishes the benchmark results and configuration at https://github.com/hkust-nlp/AgentBoard.',
  headline: 'AgentBoard reports the success rate across its 112 BabyAI episodes.',
  aliases: { Claude2: 'claude-2', 'Text-Davinci-003': 'davinci-003', 'CodeLlama-34b': 'codellama-34b-instruct',
    'Mistral-7b': 'mistral-7b-instruct-v0-2', 'DeepSeek-67b': 'deepseek-llm-67b' },
  async fetch() {
    const data = await fetchJson<Entry[]>(feed);
    return checked(data.map(({ model, tasks: { BabyAI: result } }) => ({
      model: /^Llama2-(13|70)b$/.test(model) ? model.replace('Llama2-', 'Llama-2-') + '-chat-hf' : model,
      harness: 'AgentBoard', score: percent(result.accuracy),
      metrics: { progress: percent(result.score), grounding: percent(result.grounding) },
    })), 13);
  },
};
export default board;
