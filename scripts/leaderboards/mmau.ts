// MMAU (original release). sakshi113.github.io/mmau_homepage builds its tables in the browser from JSON
// files next to the page. leaderboard_data.json is the "Leaderboard (old version)" table: per model the
// Sound, Music, Speech and Avg accuracy on test-mini and test. Avg on test-mini is the score (the split
// model cards cite). Random-guess and human rows are skipped. The v05.15.25 boards are mmau-v05-15-25.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

export const MMAU_PAGE = 'https://sakshi113.github.io/mmau_homepage/';
/** MMAU names the shared resolver cannot place. */
export const MMAU_ALIASES: Record<string, string> = {
  'Qwen2-Audio-Instruct': 'qwen2-audio-7b-instruct',
};

export const MMAU_TERMS = 'JSON files on the MMAU GitHub Pages site that the page loads; the page states no terms.';

interface Entry {
  info: { name: string; type?: string; size?: string };
  Avg?: { 'Test-mini'?: string; Test?: string };
}

/** Rows of one MMAU leaderboard file, scored by Avg test-mini accuracy. */
export async function mmauRows(file: string): Promise<LeaderboardRow[]> {
  const { leaderboardData } = await fetchJson<{ leaderboardData: Entry[] }>(MMAU_PAGE + file);
  const rows: LeaderboardRow[] = [];
  for (const e of leaderboardData) {
    if (!e.info?.name || e.info.type === 'random_guess' || e.info.type === 'human_expert') continue;
    // Keep the base checkpoint unlisted instead of resolving its name to the instruct model.
    const base = e.info.name.trim() === 'Qwen2-Audio';
    const score = num(e.Avg?.['Test-mini']);
    if (score === undefined) continue;
    // "Gemma 3n" appears once per size ("2B", "4B"). Gemma 3n names its sizes E2B and E4B
    const gemma = /^Gemma 3n$/i.test(e.info.name.trim()) && /^\d+B$/i.test(e.info.size ?? '');
    rows.push({ model: base ? 'Qwen2-Audio (base)' : gemma ? `Gemma 3n E${e.info.size}` : e.info.name.trim(), score });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'mmau',
  url: MMAU_PAGE,
  feed: `${MMAU_PAGE}leaderboard_data.json (Avg, test-mini)`,
  terms: MMAU_TERMS,
  aliases: MMAU_ALIASES,
  fetch: () => mmauRows('leaderboard_data.json'),
};
export default board;
