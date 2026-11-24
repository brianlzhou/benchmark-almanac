// HalloMTBench measures the percentage of translations with hallucinations.
// Two transcriptions of the 21 printed rates and model labels in Figure 5 agreed.
// The importer checks the full publication PDF's SHA-256 before returning them.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const feed = 'https://aclanthology.org/2026.emnlp-main.1546.pdf';
const board: Leaderboard = {
  benchmark: 'hallomtbench', url: 'https://aclanthology.org/2026.emnlp-main.1546/', feed, static: 'paper',
  terms: 'The authors publish this figure under the license linked at https://aclanthology.org/2026.emnlp-main.1546/.',
  aliases: { 'gpt-4o-mini (snapshot unspecified)': 'gpt-4o-mini' },
  async fetch() {
    return checked(await chartRows(feed, '7cda209c3a1fd2b273dca2b5610ef639f6bec1d4eed85b7dc968670686c69ea3', [
      { model: 'hy-mt1.5-7b', score: 11.6 },
      { model: 'qwen3.6-plus', score: 12.0 },
      { model: 'deepseek-v4-pro', score: 12.5 },
      { model: 'gemini-2.5-flash (snapshot unspecified)', setting: 'thinking', score: 12.8 },
      { model: 'translategemma-27b', score: 12.8 },
      { model: 'hy-mt1.5-1.8b', score: 12.9 },
      { model: 'qwen3.5-plus', score: 13.3 },
      { model: 'deepseek-v4-pro', setting: 'thinking', score: 13.3 },
      { model: 'gemini-2.5-flash (snapshot unspecified)', score: 13.8 },
      { model: 'gpt-5.4-mini', score: 14.2 },
      { model: 'translategemma-4b', score: 14.8 },
      { model: 'claude-haiku-4.5', score: 15.8 },
      { model: 'qwen3-32b', setting: 'thinking', score: 15.9 },
      { model: 'deepseek-v3', score: 16.8 },
      { model: 'translategemma-12b', score: 16.9 },
      { model: 'gemini-3-flash', score: 18.6 },
      { model: 'claude-3-7-sonnet', score: 19.0 },
      { model: 'gpt-4o-mini', score: 19.5 },
      { model: 'gpt-4o', score: 20.2 },
      { model: 'claude-3.5-sonnet', score: 29.0 },
      { model: 'hunyuan-mt-7b', score: 39.8 },
    ]), 21);
  },
};
export default board;
