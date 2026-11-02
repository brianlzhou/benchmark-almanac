// "Wer wird Millionär?" LLM benchmark (millionaire-bench, German). The leaderboard page (koray.at, the same
// files in the ikiruneo/millionaire-bench repository) reads leaderboard/leaderboard_cloud.json and
// leaderboard_local.json and ranks models by median_value, the median prize in euros over the 45 games, which
// is the score in the board's own unit. Local runs use Q4_K_M quantized weights on a laptop, so they carry
// that setting. Names are OpenRouter-style ids: a vendor prefix with an underscore ("google_gemini-3.5-flash")
// is dropped, and a trailing effort ("-high", "-max") is split off by the resolver.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'ikiruneo/millionaire-bench';
const FILES = ['leaderboard/leaderboard_cloud.json', 'leaderboard/leaderboard_local.json'];

const board: Leaderboard = {
  benchmark: 'millionaire-bench-de',
  url: 'https://koray.at/millionaire-bench/',
  feed: `${ghRaw(REPO, FILES[0])} and ${FILES[1]} (median_value)`,
  terms: 'Leaderboard files in the ikiruneo/millionaire-bench GitHub repository, which states no license; scores are cited to the author.',
  aliases: {
    'deepseek-chat-v3-0324': 'deepseek-v3-mar-2025',
    'openai-gpt-oss-120b': 'gpt-oss-120b',
    'c4ai-command-a-03-2025': 'cohere-command-a',
    'perplexity-sonar': 'sonar',
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
    'gemini-2.5-flash-lite': 'gemini-2-5-flash-lite-jun-2025',
    'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b',
    'mistral-nemo-instruct-2407': 'mistral-nemo',
    'llama-3.1-8b-instruct': 'llama-3-1-8b',
    'llama-3.2-3b-instruct': 'llama-3-2-3b',
    'phi-4-mini-instruct': 'phi-4-mini',
    'ministral-3-14b-instruct': 'ministral-3-14b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const file of FILES) {
      const local = file.includes('local');
      const { models } = await fetchJson<{ models: { model_name?: string; median_value?: number }[] }>(ghRaw(REPO, file));
      for (const m of models) {
        if (!m.model_name || typeof m.median_value !== 'number') continue;
        let model = m.model_name.trim().replace(/^(google|grok|openai|x-ai|anthropic|meta-llama|mistralai|qwen)_/i, '');
        let setting = local ? 'Q4_K_M' : undefined;
        // "deepseek-chat-v3.1-non-reasoning": DeepSeek's non-thinking mode
        if (/-non-reasoning$/.test(model)) {
          model = model.replace(/-non-reasoning$/, '').replace(/^deepseek-chat-/, 'deepseek-');
          setting = 'non-thinking';
        }
        rows.push({ model, score: m.median_value, setting });
      }
    }
    return rows;
  },
};
export default board;
