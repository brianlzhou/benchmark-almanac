// GeoBench (GeoGuessr photo geolocation). geobench.org is a single-page app whose results ship inside its
// JavaScript bundle as JSON.parse('[...]'); the bundle name changes on each deploy, so the importer finds it
// in the page's script tag and decodes the string literal without running it. Each row is a model on one
// test map; the page opens on ACW (acw-02-25-25, "Easy world map", 100 locations), the only map most models
// ran. Each map has its own importer, so scores from different task sets cannot replace the ACW score. The page ranks by average GeoGuessr score (0 to 5,000 points); the
// almanac records GeoBench in percent, as Epoch AI does, so the score here is country_success_rate (share of
// locations placed in the right country, 0 to 100). date_added is passed on for snapshot matching. The
// page's own ranking number, the average GeoGuessr score (average_score), is kept in metrics as "points".
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';

const PAGE = 'https://geobench.org/';


interface Row {
  model: string;
  test: string;
  country_success_rate?: number;
  average_score?: number;
  date_added?: string;
}

/** The value of a single-quoted JavaScript string literal body, decoded as data. */
const unquote = (s: string) =>
  s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, e: string) =>
    e.length > 1 ? String.fromCharCode(parseInt(e.slice(1), 16)) : ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' } as Record<string, string>)[e] ?? e,
  );

export function geobenchBoard(benchmark: string, test: string): Leaderboard { return {
  benchmark,
  url: PAGE,
  feed: `${PAGE}assets/index-*.js (JSON.parse data in the current bundle, all published maps)`,
  terms: 'Data shipped in the public geobench.org bundle; the site states no terms and the GeoBench repository is MIT.',
  aliases: {
    'Claude 4 Opus': 'claude-opus-4',
    'Claude 4 Sonnet': 'claude-sonnet-4',
    'Claude 4.5 Opus': 'claude-opus-4-5',
    // keyed without "(Thinking)", which the resolver turns into the setting
    'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    'Claude 4.6 Sonnet': 'claude-sonnet-4-6',
    'Claude 4.6 Opus': 'claude-opus-4-6',
    'Claude 4.6 Opus (Thinking)': 'claude-opus-4-6',
    'Claude 4.8 Opus': 'claude-opus-4-8',
    'Gemini 2.5 Flash Preview (04-17)': 'gemini-2-5-flash-apr-2025',
    'Gemini 2.5 Flash Preview (05-20)': 'gemini-2-5-flash-may-2025',
    'Gemini 2.5 Pro (05-06)': 'gemini-2-5-pro-may-2025',
    'Gemini 2.5 Pro Experimental (03-25)': 'gemini-2-5-pro-mar-2025',
    'Llama 3.2 90b Vision': 'llama-3-2-90b',
    'Qwen3-VL-235B': 'qwen3-vl-235b-a22b',
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
      if (r.test !== test) continue;
      if (typeof r.country_success_rate !== 'number') continue;
      // "Gemini 2.5 Pro (05-06 with Search)": the same model with Google Search grounding
      const search = / with Search\)$/i.test(r.model);
      const model = search ? r.model.replace(/ with Search\)$/i, ')') : r.model;
      rows.push({
        model,
        score: r.country_success_rate * 100,
        setting: search ? 'with search' : undefined,
        date: r.date_added,
        ...(typeof r.average_score === 'number' ? { metrics: { points: r.average_score } } : {}),
      });
    }
    return rows;
  },
}; }
