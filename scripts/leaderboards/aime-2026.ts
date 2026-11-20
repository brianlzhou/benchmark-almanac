// AIME 2026 on MathArena. The matharena.ai page loads each competition's table from
// /competition_tables/<id>, a JSON object whose "table" field is the server-rendered results table.
// MathArena publishes no results file (its GitHub repo has code only, and the Hugging Face *_outputs
// datasets lag the site), so the importer reads that table. The other MathArena importers reuse
// matharenaRows from this file. Besides cost and output tokens per answer, each row keeps the table's
// rank, input tokens, average retries, time per answer and the accuracy interval.
import type { Leaderboard } from './types.ts';
import { matharenaFeed, matharenaRows } from '../lib/boards/matharena.ts';

export { matharenaFeed, matharenaRows };
export const matharenaPage = (comp: string) => `https://matharena.ai/?comp=${comp}`;
export const MATHARENA_TERMS =
  'matharena.ai publishes no terms and no robots.txt; the code is MIT and the Hugging Face datasets are CC BY-NC-SA 4.0.';

/** MathArena's spellings that the shared resolver cannot place; every MathArena importer uses these. */
export const MATHARENA_ALIASES: Record<string, string> = {
  'Gemini 3 Pro (preview)': 'gemini-3-pro',
  'NVIDIA-Nemotron-3-Super': 'nemotron-3-super',
  'Grok 4 Fast R': 'grok-4-fast',
  'Qwen3-235B-2507-Think': 'qwen3-235b-a22b-thinking-jul-2025',
  'Qwen3-30B-A3B-2507-Think': 'qwen3-30b-a3b-thinking-jul-2025',
  'DeepSeek-R1-0528': 'deepseek-r1-may-2025',
  // config deepseek/deepseek_r1, the January 2025 model (the 0528 update has its own row)
  'DeepSeek-R1': 'deepseek-r1',
  'DeepSeek-R1-Distill-1.5B': 'deepseek-r1-distill-qwen-1-5b',
  'DeepSeek-R1-Distill-14B': 'deepseek-r1-distill-qwen-14b',
  'DeepSeek-R1-Distill-32B': 'deepseek-r1-distill-qwen-32b',
  'DeepSeek-R1-Distill-70B': 'deepseek-r1-distill-llama-70b',
  'Gemini 2.5 Pro (05-06)': 'gemini-2-5-pro-may-2025',
};

/**
 * On the 2025 competitions MathArena ran in spring 2025, plain "Gemini 2.5 Pro" (config gemini-pro-2.5) is
 * the March 2025 model: those tables list the 05-06 update as a separate row. Later tables (IMO 2025) ran
 * after the June GA release, which the shared resolver picks by default.
 */
export const MATHARENA_SPRING_2025_ALIASES: Record<string, string> = {
  ...MATHARENA_ALIASES,
  'Gemini 2.5 Pro': 'gemini-2-5-pro-mar-2025',
};

const COMP = 'aime--aime_2026';

const board: Leaderboard = {
  benchmark: 'aime-2026',
  host: 'MathArena',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
