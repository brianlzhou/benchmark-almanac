// GeoBench (GeoGuessr photo geolocation). geobench.org is a single-page app whose results ship inside its
// JavaScript bundle as JSON.parse('[...]'); the bundle name changes on each deploy, so the importer finds it
// in the page's script tag and decodes the string literal without running it. Each row is a model on one
// test map; the page opens on ACW (acw-02-25-25, "Easy world map", 100 locations), the only map most models
// ran, which is the one read here. The page ranks by average GeoGuessr score (0 to 5,000 points); the
// almanac records GeoBench in percent, as Epoch AI does, so the score here is country_success_rate (share of
// locations placed in the right country, 0 to 100). date_added is passed on for snapshot matching.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://geobench.org/';
const TEST = 'acw-02-25-25';

interface Row {
  model: string;
  test: string;
  country_success_rate?: number;
  date_added?: string;
}

/** The value of a single-quoted JavaScript string literal body, decoded as data. */
const unquote = (s: string) =>
  s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, e: string) =>
    e.length > 1 ? String.fromCharCode(parseInt(e.slice(1), 16)) : ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' } as Record<string, string>)[e] ?? e,
  );

const board: Leaderboard = {
  benchmark: 'geobench',
  url: PAGE,
  feed: `${PAGE}assets/index-*.js (JSON.parse data in the current bundle, test ${TEST})`,
  terms: 'Data shipped in the public geobench.org bundle; the site states no terms and the GeoBench repository is MIT.',
  aliases: {
    'Claude 4 Opus': 'claude-opus-4',
    'Claude 4 Sonnet': 'claude-sonnet-4',
    'Claude 4.5 Opus': 'claude-opus-4-5',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('no bundle script on the GeoBench page');
    const js = await fetchText(new URL(src, PAGE).href);
    const at = js.indexOf(`JSON.parse('[{"model"`);
    if (at < 0) throw new Error('no results array in the GeoBench bundle');
    const start = at + "JSON.parse('".length;
    let end = start;
    while (end < js.length && !(js[end] === "'" && js[end - 1] !== '\\')) end++;
    const data = JSON.parse(unquote(js.slice(start, end))) as Row[];
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (r.test !== TEST || typeof r.country_success_rate !== 'number') continue;
      rows.push({ model: r.model, score: r.country_success_rate * 100, date: r.date_added });
    }
    return rows;
  },
};
export default board;
