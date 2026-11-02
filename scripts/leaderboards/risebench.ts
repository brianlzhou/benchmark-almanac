// RISEBench (reasoning-informed visual editing). The VisionXLab/RISEBench_Leaderboard Space is a static page
// that renders data/leaderboard.json, which holds two boards: RISEBench (the original published results) and
// RISEBench++. The page opens on the English results sorted by accuracy "total", the share of edits judged
// fully correct (0 to 100), which is the score. On RISEBench++ a model that only takes one input image has
// no total and is left out, and the "Agentic Methods" group (pipelines, not models) is kept but matches no
// model record. "Gemini-2.0-Flash-exp" is the experimental image-generation release, which the registry
// does not hold, so it is left out rather than read as the Gemini 2.0 Flash chat model.
// risebench-plus-plus.ts reads the other board through riseRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const RISE_FEED = 'https://huggingface.co/spaces/VisionXLab/RISEBench_Leaderboard/resolve/main/data/leaderboard.json';
export const RISE_URL = 'https://huggingface.co/spaces/VisionXLab/RISEBench_Leaderboard';
export const RISE_TERMS = 'Static leaderboard file in the VisionXLab/RISEBench_Leaderboard Hugging Face Space, which states no license; the RISEBench code is Apache-2.0.';

interface Board {
  id: string;
  results_by_language: Record<string, { models: { name: string; accuracy?: { total?: number | null } }[] }>;
}

/** The English rows of one board in the file ("risebench" or "risebench-plusplus"), scored by accuracy total. */
export async function riseRows(id: string): Promise<LeaderboardRow[]> {
  const { benchmarks } = await fetchJson<{ benchmarks: Board[] }>(RISE_FEED);
  const b = benchmarks.find((x) => x.id === id);
  if (!b) throw new Error(`no ${id} board in leaderboard.json`);
  const rows: LeaderboardRow[] = [];
  for (const m of b.results_by_language.en?.models ?? []) {
    const total = m.accuracy?.total;
    if (m.name && m.name !== 'Gemini-2.0-Flash-exp' && typeof total === 'number') rows.push({ model: m.name.trim(), score: total });
  }
  return rows;
}

export const RISE_ALIASES: Record<string, string> = {
  'Gemini-2.5-Flash-Image (Nano Banana)': 'gemini-2-5-flash-image-preview-nano-banana',
  'Nano Banana': 'gemini-2-5-flash-image-preview-nano-banana',
  'Nano Banana Pro': 'gemini-3-pro-image-preview-nano-banana-pro',
  'Nano Banana 2 Lite': 'gemini-3-1-flash-lite-image-nano-banana-2-lite',
  'Gemini-2.0-Flash-pre': 'gemini-2-0-flash-preview-image-generation',
};

const board: Leaderboard = {
  benchmark: 'risebench',
  url: RISE_URL,
  feed: `${RISE_FEED} (risebench, en, accuracy.total)`,
  terms: RISE_TERMS,
  aliases: RISE_ALIASES,
  fetch: () => riseRows('risebench'),
};
export default board;
