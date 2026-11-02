// PhAIL: DROID Everyday tasks (Positronic Robotics). phail.ai serves its leaderboard as one server-rendered
// HTML table: a model column and one column per benchmark, "DROID: Everyday tasks" (Reliability, % of task
// done, from an item-response model over 286 tasks) and "Pick and Place" (Reliability, % items placed).
// Each cell holds the value and a bootstrap margin; the value is the score. Models are robot policies; the
// short name in the model cell is kept. phail.ts reads the Pick and Place column through phailRows. The
// teleoperated reference row is skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

export const PHAIL_PAGE = 'https://phail.ai/';
export const PHAIL_TERMS = 'Server-rendered public page; phail.ai robots.txt (Cloudflare content-signal preamble) sets no signals and disallows nothing, and the site publishes no terms.';

/** Scores from the PhAIL home table column whose header starts with `column`. */
export async function phailRows(column: string): Promise<LeaderboardRow[]> {
  const t = tables(await fetchText(PHAIL_PAGE)).find((rows) => rows[0]?.[0]?.text === 'Model');
  if (!t) throw new Error('PhAIL table not found');
  const col = t[0].findIndex((c) => c.text.startsWith(column));
  if (col < 0) throw new Error(`no "${column}" column: ${t[0].map((c) => c.text).join(' | ')}`);
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    const name = text(r[0]?.html.match(/<span class="model-short-name">([\s\S]*?)<\/span>/)?.[1] ?? r[0]?.text ?? '');
    const score = num(text(r[col]?.html.match(/<span class="score-value">([\s\S]*?)<\/span>/)?.[1] ?? ''));
    if (!name || score === undefined || /teleop|human/i.test(r[0]?.text ?? '')) continue;
    rows.push({ model: name, score });
  }
  if (!rows.length) throw new Error(`no PhAIL rows for ${column}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'phail-droid-everyday',
  url: `${PHAIL_PAGE}benchmark/droid`,
  feed: `${PHAIL_PAGE} (server-rendered table, "DROID: Everyday tasks" Reliability)`,
  terms: PHAIL_TERMS,
  aliases: {
    // the model page names the DROID run as GR00T N1.7 DROID
    'GR00T': 'gr00t-n1-7',
  },
  fetch: () => phailRows('DROID'),
};
export default board;
