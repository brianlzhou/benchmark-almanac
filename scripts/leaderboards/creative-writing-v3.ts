// Creative Writing v3 on eqbench.com. Most eqbench.com boards ship their data as a CSV string inside the page
// script (for example `let leaderboardDataCreativeWritingV3 = \`...\``); eqbenchCsv reads that string as data,
// never runs the script, and returns rows keyed by the CSV header. A leading "*" on a model name marks a model
// new to the board and is dropped. The other eqbench.com importers in this pass use eqbenchCsv.
//
// This board: creative_writing.js has elo_score and creative_writing_score (a 0 to 20 rubric mean). The page
// shows the rubric times 5 as "Rubric Score" beside the Elo, and labs cite that 0 to 100 rubric figure (Qwen3
// 84.6, Ring-1T 85.4), so the rubric times 5 is the score here. Elo is relative to the models on the board.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const EQBENCH_TERMS = 'Generated page script on the eqbench.com GitHub Pages site, which states no terms or license for the scores.';
export const eqbenchFeed = (file: string, variable: string) => `https://eqbench.com/${file} (${variable})`;

/** The CSV assigned to `variable` in an eqbench.com script, as rows keyed by header, model names cleaned. */
export async function eqbenchCsv(file: string, variable: string): Promise<Record<string, string>[]> {
  const js = await fetchText(`https://eqbench.com/${file}`);
  const at = js.search(new RegExp(`\\b${variable}\\s*=\\s*\``));
  if (at < 0) throw new Error(`${variable} not found in ${file}`);
  const open = js.indexOf('`', at) + 1;
  const close = js.indexOf('`', open);
  const rows = parseCsv(js.slice(open, close).trim());
  if (!rows.length) throw new Error(`no rows in ${variable}`);
  const name = Object.keys(rows[0])[0];
  return rows.map((r) => ({ ...r, [name]: r[name].replace(/^\*/, '').trim() }));
}

/** One row per model: the first CSV column is the model, `column` the score, times `scale`. */
export async function eqbenchRows(file: string, variable: string, column: string, scale = 1): Promise<LeaderboardRow[]> {
  const rows = await eqbenchCsv(file, variable);
  const name = Object.keys(rows[0])[0];
  if (!(column in rows[0])) throw new Error(`no ${column} column in ${variable}`);
  return rows
    .map((r) => ({ model: r[name], score: parseFloat(r[column]) * scale }))
    .filter((r) => r.model && r.model !== 'random-baseline' && Number.isFinite(r.score));
}

const board: Leaderboard = {
  benchmark: 'creative-writing-v3',
  url: 'https://eqbench.com/creative_writing.html',
  feed: `${eqbenchFeed('creative_writing.js', 'leaderboardDataCreativeWritingV3')} creative_writing_score x 5`,
  terms: EQBENCH_TERMS,
  aliases: {},
  fetch: () => eqbenchRows('creative_writing.js', 'leaderboardDataCreativeWritingV3', 'creative_writing_score', 5),
};
export default board;
