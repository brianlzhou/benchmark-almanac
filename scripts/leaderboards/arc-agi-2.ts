// ARC-AGI-2 on the ARC Prize leaderboard. The page's chart and table load one pre-joined JSON file per
// version from /media/data/leaderboard/; scores there are fractions of tasks solved (0 to 1).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export interface ArcEval {
  datasetId: string;
  modelId: string;
  modelDisplayName: string;
  modelType?: string | null;
  modelGroup?: string | null;
  modelReleaseDate?: string | null;
  providerId?: string;
  providerDisplayName?: string;
  score: number | null;
  /** US dollars per task, the x-axis of the page's chart (ARC-AGI-1 and 2). */
  costPerTask?: number | null;
  /** US dollars for the whole run, the x-axis on ARC-AGI-3, from about $200 to $50,000. */
  cost?: number | null;
  display?: boolean;
}

export const arcFeed = (v: 'v2' | 'v3') => `https://arcprize.org/media/data/leaderboard/${v}.json`;

/** Rows the page shows for models: no human panel and no Kaggle competition entries. */
export async function arcRows(v: 'v2' | 'v3'): Promise<LeaderboardRow[]> {
  const { evaluations } = await fetchJson<{ evaluations: ArcEval[] }>(arcFeed(v));
  const rows: LeaderboardRow[] = [];
  for (const e of evaluations) {
    if (e.display === false || e.score == null) continue;
    if (e.providerId === 'Human' || e.modelType === 'Custom') continue;
    let model = e.modelDisplayName.replace(/\s*[¹²³⁴⁵⁶⁷⁸⁹]+\s*$/, '').trim();
    let harness: string | undefined;
    // "GPT-6 Astra - Provider Adapter (High)": the ARC-AGI-3 harness that keeps reasoning state
    if (/ - Provider Adapter/.test(model)) {
      model = model.replace(' - Provider Adapter', '');
      harness = 'Provider Adapter';
    } else if (v === 'v3') harness = 'standard';
    // "Gemini 3 Pro (Refine.)": a third-party refinement system built on the model
    if (/\(Refine\.\)/.test(model)) {
      model = model.replace(/\s*\(Refine\.\)/, '');
      harness = `${e.providerDisplayName} refinement`;
    }
    // "Claude 3.7 (16K)", "Claude Opus 4.6 (120K, Low)": a thinking-token budget, kept as the setting
    let setting: string | undefined;
    const budget = model.match(/\s*\(([^()]*\b\d+K\b[^()]*)\)\s*$/);
    if (budget) {
      setting = budget[1].toLowerCase();
      model = model.slice(0, budget.index).trim();
    }
    rows.push({
      model,
      // the page shows score * 100 for scores in (0, 1]
      score: e.score * 100,
      setting,
      harness,
      date: e.modelReleaseDate?.slice(0, 10),
      cost: e.costPerTask ?? e.cost ?? undefined,
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'arc-agi-2',
  url: 'https://arcprize.org/leaderboard',
  feed: arcFeed('v2'),
  terms: 'Public JSON file the ARC Prize leaderboard page loads; robots.txt allows all paths.',
  aliases: {
    'Claude 3.7': 'claude-3-7-sonnet',
    // the only Claude 4.7 model, released the same day (2026-04-16)
    'Claude 4.7': 'claude-opus-4-7',
    'Gemini 2.5 Flash (Preview)': 'gemini-2-5-flash-may-2025',
    'Gemini 3.1 Pro (Preview)': 'gemini-3-1-pro',
    // the February 2026 Deep Think; the earlier "(Preview)" run has no registry entry
    'Gemini 3 Deep Think (2/26)': 'gemini-3-deep-think',
    'Codex Mini (Latest)': 'codex-mini-2025-05-16',
    'Magistral Small': 'magistral-small-1-0',
    'Qwen3-235b-a22b Instruct (25/07)': 'qwen3-235b-a22b-instruct-jul-2025',
    'Tiny Recursion Model (TRM)': 'tiny-recursion-model',
    'Deepseek R1 (05/28)': 'deepseek-r1-may-2025',
    // model id grok-4-fast-reasoning: Grok 4 Fast, not Grok 4
    'Grok 4 (Fast Reasoning)': 'grok-4-fast',
  },
  fetch: () => arcRows('v2'),
};
export default board;
