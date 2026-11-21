// LLMzSzŁ evaluates language models on Polish national exams across academic and professional domains.
// The official leaderboard's Score field is the overall percentage across its exam collection.
// This importer reads the makers' JSON leaderboard.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://huggingface.co/spaces/amu-cai/LLMZSZL_Leaderboard/resolve/main/leaderboards/llmzszl.json';
type Entry = { Name?: string; Score?: number; Date?: string };

const board: Leaderboard = {
  benchmark: 'llmzsz',
  url: 'https://huggingface.co/spaces/amu-cai/LLMZSZL_Leaderboard',
  feed,
  terms: 'The authors publish this leaderboard JSON in their Hugging Face Space. ' + feed,
  async fetch() {
    const entries = await fetchJson<Entry[]>(feed);
    const rows = entries.filter(entry => typeof entry.Name === 'string' && Number.isFinite(entry.Score)).map(entry => ({
      model: entry.Name!, score: entry.Score!,
    }));
    return checked(rows, 50);
  },
};

export default board;
