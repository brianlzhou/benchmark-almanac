// VisuLogic. The project page on visulogic-benchmark.github.io carries the leaderboard as a static HTML
// table: Rank | Model | Overall | six category columns. Overall accuracy (0 to 100) is the score. Names
// carry a "new" badge for recent additions, which is dropped, and the Human baseline row is skipped.
//
// tableRows, exported here, is a small reader for leaderboards published as one static HTML table. Other
// importers that read a single server-rendered table reuse it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, type Cell } from '../lib/html.ts';

export interface TableSpec {
  /** Header of the model column, as a regex on the header text. */
  model: RegExp;
  /** Header of the headline score column. */
  score: RegExp;
  /** Multiply the score by this (for example 100 when the table shows fractions). */
  scale?: number;
  /** Header of a column to keep as the harness, a setting or a date. */
  harness?: RegExp;
  setting?: RegExp;
  date?: RegExp;
  /** Header of a per-task cost column in US dollars. */
  cost?: RegExp;
  /** Rows whose model cell matches this are not models (human baselines, random, oracle). */
  skip?: RegExp;
  /** Which header row to read when a table has two (0 by default). */
  headRow?: number;
  /** Turns the model cell into the board name (for example to drop badges). */
  name?: (cell: Cell) => string;
}

/** Rows of the first table in `html` whose header row has both the model and the score column. */
export function readTable(html: string, spec: TableSpec): LeaderboardRow[] {
  const h = spec.headRow ?? 0;
  const t = tables(html).find((rows) => rows[h]?.some((c) => spec.model.test(c.text)) && rows[h]?.some((c) => spec.score.test(c.text)));
  if (!t) throw new Error(`no table with columns ${spec.model} and ${spec.score}`);
  const head = t[h].map((c) => c.text);
  const col = (re?: RegExp) => (re ? head.findIndex((x) => re.test(x)) : -1);
  const [iModel, iScore, iHarness, iSetting, iDate, iCost] = [spec.model, spec.score, spec.harness, spec.setting, spec.date, spec.cost].map(col);
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(h + 1)) {
    // a row shorter than the header is a group label or a note, not a model
    if (r.length < head.length || !r[iModel]) continue;
    const model = (spec.name ? spec.name(r[iModel]) : r[iModel].text).trim();
    const score = num(r[iScore]?.text);
    if (!model || score === undefined || spec.skip?.test(model)) continue;
    const date = iDate >= 0 ? r[iDate]?.text.match(/\d{4}-\d\d(-\d\d)?/)?.[0] : undefined;
    rows.push({
      model,
      score: score * (spec.scale ?? 1),
      harness: iHarness >= 0 ? r[iHarness]?.text || undefined : undefined,
      setting: iSetting >= 0 ? r[iSetting]?.text.replace(/^[-–]$/, '') || undefined : undefined,
      date: date && date.length === 7 ? `${date}-01` : date,
      cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
    });
  }
  if (!rows.length) throw new Error('the table has no model rows');
  return rows;
}

/** Fetches `url` and reads its leaderboard table. */
export async function tableRows(url: string, spec: TableSpec): Promise<LeaderboardRow[]> {
  return readTable(await fetchText(url), spec);
}

const URL = 'https://visulogic-benchmark.github.io/VisuLogic/';

const board: Leaderboard = {
  benchmark: 'visulogic',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static GitHub Pages project page with no robots.txt and no terms; the VisuLogic repository is MIT and the scores are cited to the authors.',
  aliases: {},
  fetch: () =>
    tableRows(URL, {
      model: /^Model$/i,
      score: /^Overall$/i,
      skip: /^(Human|Random)/i,
      name: (c) => c.text.replace(/\s+new$/i, ''),
    }),
};
export default board;
