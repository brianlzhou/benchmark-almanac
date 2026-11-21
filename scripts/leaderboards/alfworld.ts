// ALFWorld tests whether agents complete household tasks. AgentBoard reports success, progress and grounding rates.
// The headline is the percentage of ALFWorld episodes completed, from the released AgentBoard comparison.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://hkust-nlp.github.io/agentboard/data/To_Release/main_data_new.json';
type Entry = { model: string, tasks: { AlfWorld: { accuracy: string, score: string, grounding: string } } };
function percent(value: string) {
  if (!/^\d+(?:\.\d+)?%$/.test(value)) throw new Error('Missing ALFWorld percentage');
  return parseFloat(value);
}
const board: Leaderboard = {
  benchmark: 'alfworld', host: 'AgentBoard', feed, url: 'https://hkust-nlp.github.io/agentboard/static/leaderboard.html',
  terms: 'AgentBoard publishes its evaluations at https://github.com/hkust-nlp/AgentBoard.',
  aliases: { Claude2: 'claude-2', 'Text-Davinci-003': 'davinci-003', 'CodeLlama-34b': 'codellama-34b-instruct', 'Mistral-7b': 'mistral-7b-instruct-v0-2',
    'DeepSeek-67b': 'deepseek-llm-67b' },
  async fetch() {
    const data = await fetchJson<Entry[]>(feed);
    return checked(data.map(({model, tasks}) => ({
      model: model === 'Llama2-70b' ? 'Llama-2-70b-chat-hf' : model === 'Llama2-13b' ? 'Llama-2-13b-chat-hf' : model, harness: 'AgentBoard', score: percent(tasks.AlfWorld.accuracy),
      metrics: { progress: percent(tasks.AlfWorld.score), grounding: percent(tasks.AlfWorld.grounding) },
    })), 13);
  },
};
export default board;
