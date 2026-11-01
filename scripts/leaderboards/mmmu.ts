// MMMU (validation overall). mmmu-benchmark.github.io renders one table from leaderboard_data.json: per
// model an MMMU-Pro overall, an MMMU validation overall and an MMMU test overall, as strings ("-" when
// missing). Labs cite the validation split, so that column is the score here. Most rows are marked
// source "author" (the page's asterisk: results provided by the model's authors). The human-expert and
// random baselines are skipped. MMMU-Pro (mmmu-pro.ts) reads the same file through mmmuRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const MMMU_FEED = 'https://mmmu-benchmark.github.io/leaderboard_data.json';
export const MMMU_TERMS =
  'Static JSON on the MMMU GitHub Pages site, which states no licence or terms; the MMMU repository is Apache-2.0.';

interface Row {
  info: { name: string; date?: string; type: string };
  pro?: { overall?: string };
  validation?: { overall?: string };
  test?: { overall?: string };
}

/** "GPT-5.4 Thinking w/ tools" -> model "GPT-5.4", setting "thinking, with tools". */
export function splitMmmuName(raw: string): { model: string; setting?: string } {
  let model = raw.replace(/‑/g, '-').trim();
  const parts: string[] = [];
  const w = model.match(/\s+w\/(o)?\s+(tools|python|thinking)$/i);
  if (w) {
    model = model.slice(0, w.index);
    const what = w[2].toLowerCase();
    parts.unshift(what === 'thinking' ? (w[1] ? 'non-thinking' : 'thinking') : `${w[1] ? 'no' : 'with'} ${what}`);
  }
  const effort = model.match(/\s+\((minimal|low|medium|high|xhigh|max)\)$/i);
  if (effort) {
    model = model.slice(0, effort.index);
    parts.unshift(effort[1].toLowerCase());
  }
  const thinking = model.match(/\s+Thinking$/i);
  if (thinking) {
    model = model.slice(0, thinking.index);
    parts.unshift('thinking');
  }
  return { model, setting: parts.length ? parts.join(', ') : undefined };
}

export async function mmmuRows(column: 'validation' | 'pro'): Promise<LeaderboardRow[]> {
  const { leaderboardData } = await fetchJson<{ leaderboardData: Row[] }>(MMMU_FEED);
  const rows: LeaderboardRow[] = [];
  for (const r of leaderboardData) {
    if (r.info.type === 'human_expert' || r.info.type === 'random_frequent') continue;
    const score = Number(r[column]?.overall);
    if (!Number.isFinite(score) || !r[column]?.overall) continue;
    rows.push({ ...splitMmmuName(r.info.name), score, date: r.info.date || undefined });
  }
  return rows;
}

export const MMMU_ALIASES: Record<string, string> = {
  'GPT-4o (0513)': 'gpt-4o-may-2024',
  'GPT-4o (1120)': 'gpt-4o-nov-2024',
  'Gemini 3.0 Pro': 'gemini-3-pro',
  'Gemini 2.5 Pro Deep-Think': 'gemini-2-5-deep-think',
  'Gemini 2.5 Pro 05-06': 'gemini-2-5-pro-may-2025',
  'Gemini 2.5 Flash 05-20': 'gemini-2-5-flash-may-2025',
  'Gemini 1.5 Pro (0523)': 'gemini-1-5-pro-may-2024',
  // the February 2025 beta of the model the registry lists at its April API release
  'Grok 3 Beta': 'grok-3',
  'GPT-4V(ision) (Playground)': 'gpt-4v',
  'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
  'Phi-3.5-Vision': 'phi-3-5-vision-instruct',
  'Nova Pro': 'amazon-nova-pro',
};

const board: Leaderboard = {
  benchmark: 'mmmu',
  url: 'https://mmmu-benchmark.github.io/#leaderboard',
  feed: `${MMMU_FEED} (validation.overall)`,
  terms: MMMU_TERMS,
  aliases: MMMU_ALIASES,
  fetch: () => mmmuRows('validation'),
};
export default board;
