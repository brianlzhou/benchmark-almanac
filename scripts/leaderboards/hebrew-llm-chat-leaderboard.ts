// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// Dicta's Hebrew chat leaderboard reads one JSON score file per model. All five measures are percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'hebrew-llm-leaderboard/chat-results';
const feed = 'https://huggingface.co/api/datasets/' + repo;
const parts = { TranslationPairwise: 'Translation', SummaryPairwise: 'Summarization', Trivia0Shot: 'Trivia', Winograd0Shot: 'Winograd', Nikud: 'Nikud' };
const knownModels = {
  'CohereLabs--aya-expanse-32b': 'aya-expanse-32b',
  'CohereLabs--c4ai-command-a-03-2025': 'cohere-command-a',
  'MiniMaxAI--MiniMax-M2.5': 'minimax-m2-5',
  'Qwen--Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
  'Qwen--Qwen3.5-122B-A10B': 'qwen3-5-122b-a10b',
  'Qwen--Qwen3.5-397B-A17B': 'qwen3-5-397b-a17b',
  'ai21labs--AI21-Jamba-Large-1.7': 'jamba-1-7-large',
  'ai21labs--AI21-Jamba-Mini-1.7': 'jamba-1-7-mini',
  'anthropic--claude-haiku-4.5': 'claude-haiku-4-5',
  'anthropic--claude-sonnet-4.5': 'claude-sonnet-4-5',
  'deepseek--deepseek-chat-v3.1': 'deepseek-v3-1',
  'google--gemini-3-flash-preview': 'gemini-3-flash',
  'google--gemini-3-pro-preview': 'gemini-3-pro',
  'google--gemma-3-27b-it': 'gemma-3-27b',
  'google--gemma-4-26B-A4B-it': 'gemma-4-26b-a4b',
  'google--gemma-4-31B-it': 'gemma-4-31b-it',
  'meta-llama--Llama-3.3-70B-Instruct': 'llama-3-3-70b-instruct',
  'minimax--minimax-m2.7': 'minimax-m2-7',
  'moonshotai--kimi-k2-0905': 'kimi-k2-sep-2025',
  'nvidia--NVIDIA-Nemotron-3-Nano-30B-A3B-BF16': 'nemotron-3-nano-30b-a3b',
  'nvidia--NVIDIA-Nemotron-3-Super-120B-A12B-BF16': 'nemotron-3-super',
  'openai--gpt-4o-mini': 'gpt-4o-mini',
  'openai--gpt-5-mini': 'gpt-5-mini',
  'openai--gpt-5-nano': 'gpt-5-nano',
  'openai--gpt-5.1': 'gpt-5-1',
  'openai--gpt-oss-120b': 'gpt-oss-120b',
  'z-ai--glm-4.6': 'glm-4-6',
  'z-ai--glm-5.3-flash': 'glm-5-3-flash',
  'zai-org--GLM-5.1': 'glm-5-1',
};
const board: Leaderboard = {
  benchmark: 'hebrew-llm-chat-leaderboard', url: 'https://huggingface.co/spaces/hebrew-llm-leaderboard/chat-leaderboard', feed, parts,
  terms: 'Dicta hosts this public results archive on Hugging Face under the platform terms. https://huggingface.co/terms-of-service',
  aliases: Object.fromEntries(Object.entries(knownModels).flatMap(([fileName, id]) => [
    [fileName, id], [fileName.replace('--', '/'), id],
  ])),
  async fetch() {
    const index = await fetchJson<{ sha: string; siblings: { rfilename: string }[] }>(feed);
    if (!/^[a-f0-9]{40}$/.test(index.sha)) throw new Error('Missing results revision');
    const rows: LeaderboardRow[] = [];
    for (const { rfilename } of index.siblings.filter(f => f.rfilename.endsWith('.scores.json'))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const record = await fetchJson<Record<string, unknown>>('https://huggingface.co/datasets/' + repo + '/raw/' + index.sha + '/' + encodeURIComponent(rfilename));
      if (typeof record.name !== 'string' || !record.name.trim()) throw new Error('Unexpected model in ' + rfilename);
      const metrics: Record<string, number> = {};
      for (const part of Object.keys(parts)) {
        const value = record[part];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Invalid ' + part + ' for ' + record.name);
        metrics[part] = value;
      }
      rows.push({ model: record.name, metrics, score: Object.values(metrics).reduce((sum, value) => sum + value, 0) / 5 });
    }
    return checked(rows, 34);
  },
};
export default board;
