// GarbleBench tests seven models on 24 questions at 12 typo corruption rates.
// The headline score is tolerance, the area under accuracy from clean to fully corrupted input, expressed as a percentage.
// This importer reads the published data.json file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://garble-bench.adamholter.chatgpt.site/';
const FEED = 'https://garble-bench.adamholter.chatgpt.site/data.json';
interface Config { name?: string; effort?: string; complete?: boolean; tolerance?: number; breaks?: number; secs?: number; tokens?: number; }
const board: Leaderboard = {
  benchmark: 'garblebench',
  url: PAGE,
  feed: FEED,
  terms: 'The GarbleBench page publishes data.json without a separate reuse license. Results are credited to Adam Holter and the GarbleBench project.',
  aliases: {
    'GPT-6.1 Sol': 'gpt-6-1-sol',
    'GPT-6.1 Terra': 'gpt-6-1-terra',
    'GPT-6 Astra': 'gpt-6-astra',
    'GPT-6 Luna': 'gpt-6-luna',
    'Gemini 4 Argon': 'gemini-4-argon',
    'Gemini 3.8 Flash': 'gemini-3-8-flash',
    'Grok 4.7': 'grok-4-7',
  },
  async fetch() {
    const data = await fetchJson<{ built?: string; rates?: number[]; questions?: unknown[]; configs?: Config[] }>(FEED);
    if (!data.built || !Array.isArray(data.rates) || data.rates.length !== 12 || !Array.isArray(data.questions) || data.questions.length !== 24 || !Array.isArray(data.configs))
      throw new Error('GarbleBench: unexpected data shape');
    const rows: LeaderboardRow[] = data.configs.filter((c) => c.complete !== false).map((c) => {
      if (!c.name || typeof c.tolerance !== 'number' || typeof c.breaks !== 'number') throw new Error('GarbleBench: configuration missing required fields');
      return { model: c.name, setting: c.effort, score: c.tolerance, metrics: { breaks: c.breaks, latency: c.secs ?? 0, tokens: c.tokens ?? 0 } };
    });
    if (rows.length < 20) throw new Error(`GarbleBench: ${rows.length} complete configurations, expected at least 20`);
    return rows;
  },
};
export default board;
