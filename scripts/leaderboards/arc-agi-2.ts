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
    rows.push({
      model,
      // the page shows score * 100 for scores in (0, 1]
      score: e.score * 100,
      harness,
      date: e.modelReleaseDate?.slice(0, 10),
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'arc-agi-2',
  url: 'https://arcprize.org/leaderboard',
  feed: arcFeed('v2'),
  terms: 'Public JSON file the ARC Prize leaderboard page loads; robots.txt allows all paths.',
  aliases: {},
  fetch: () => arcRows('v2'),
};
export default board;
