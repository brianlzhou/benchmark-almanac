// AIME 2026 on MathArena. The matharena.ai page loads each competition's table from
// /competition_tables/<id>, a JSON object whose "table" field is the server-rendered results table.
// MathArena publishes no results file (its GitHub repo has code only, and the Hugging Face *_outputs
// datasets lag the site), so the importer reads that table. The other MathArena importers reuse
// matharenaRows from this file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const matharenaFeed = (comp: string) => `https://matharena.ai/competition_tables/${comp}`;
export const matharenaPage = (comp: string) => `https://matharena.ai/?comp=${comp}`;
export const MATHARENA_TERMS =
  'matharena.ai publishes no terms and no robots.txt; the code is MIT and the Hugging Face datasets are CC BY-NC-SA 4.0.';

const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/⚠️/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * One row per model in the competition's main table, with "Accuracy" as the score (0 to 100).
 * Rows marked data-predicted="yes" include item-response-theory estimates for unrun questions; they are skipped.
 */
export async function matharenaRows(comp: string): Promise<LeaderboardRow[]> {
  const { table } = await fetchJson<{ table: string }>(matharenaFeed(comp));
  const rows: LeaderboardRow[] = [];
  for (const m of table.matchAll(/<tr class="model-row"([\s\S]*?)<\/tr>/g)) {
    const tr = m[1];
    const name = tr.match(/<a class="model-link"[^>]*>([\s\S]*?)<\/a>/);
    const acc = tr.match(/metric-bar-cell--accuracy[^>]*?data-predicted="(\w+)"[^>]*>([\s\S]*?)<\/td>/);
    if (!name || !acc) continue;
    if (acc[1] !== 'no') continue;
    const pct = text(acc[2]).match(/^(-?[\d.]+)%/);
    if (!pct) continue;
    let model = text(name[1]);
    let setting: string | undefined;
    // "Kimi K3 (Think)": MathArena's label for thinking mode
    const think = model.match(/\s*\(Think\)$/i);
    if (think) {
      setting = 'thinking';
      model = model.slice(0, think.index);
    }
    rows.push({ model, score: Number(pct[1]), setting });
  }
  if (!rows.length) throw new Error(`no rows in ${comp}`);
  return rows;
}

const COMP = 'aime--aime_2026';

const board: Leaderboard = {
  benchmark: 'aime-2026',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: {},
  fetch: () => matharenaRows(COMP),
};
export default board;
