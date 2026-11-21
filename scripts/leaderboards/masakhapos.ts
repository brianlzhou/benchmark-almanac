// MasakhaPOS evaluates part-of-speech tagging in African languages.
// The full AfroBench leaderboard publishes an F1 percentage for this dataset.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mcgill-nlp.github.io/AfroBench/leaderboard_json/afrobench.json';
export default {
  benchmark: 'masakhapos', host: 'AfroBench', url: 'https://mcgill-nlp.github.io/AfroBench/leaderboard.html', feed,
  terms: 'AfroBench publishes its leaderboard at https://mcgill-nlp.github.io/AfroBench/leaderboard.html',
  aliases: {'GPT-4o (Aug)': 'gpt-4o-aug-2024', 'Gemma1.1 7b': 'gemma-1-1-7b-it',
    'Gemma2 27b': 'gemma-2-27b', 'Gemma2 9b': 'gemma-2-9b', 'LLaMa3.1 70B': 'llama-3-1-70b',
    'LLaMa3.1 8B': 'llama-3-1-8b', 'LLaMa3 8B': 'llama-3-8b', 'LLaMa2 7b': 'llama-2-7b'},
  async fetch() {
    const data = await fetchJson<{NLU: {POS: {datasets: {masakhapos: Record<string, number>}}}}>(feed);
    const scores = data.NLU?.POS?.datasets?.masakhapos;
    if (!scores) throw new Error('Missing MasakhaPOS scores');
    return checked(Object.entries(scores).map(([model,score]) => ({model,score})), 12);
  },
} satisfies Leaderboard;
