// RealmPathology (micro1). micro1's benchmark report pages are static Webflow HTML with the results as
// plain tables. This page's main results table gives per model the reasoning effort, the mean rubric score
// (0 to 1) with its 95% interval, best of 3, pass@3, perfect runs and tasks won. Mean, the table's sort
// order and the report's headline, is the score, as a percent. The effort cell ("max, via OpenRouter",
// "max, task denied") gives the setting. The 95% CI (metrics.ciLow, ciHigh), Best of 3 (bestOf3) and Pass@3
// (passAt3) are kept as percents, read through micro1Rows' optional metric columns. Other micro1 importers use micro1Rows (results tables) or
// micro1Data (the leaderboard card data inline on every report page) from this file. RealmPathology opts
// in to the separate Reasoning tokens (k) table, converted to reasoningTokens without setting output tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, num, tables } from '../lib/html.ts';

export const MICRO1_TERMS =
  'Static report page on micro1.ai; robots.txt allows all paths, and the legal center lists no website terms of use (only privacy, cookie, candidate and referral terms).';

/** Names on micro1 boards that the resolver cannot place. */
export const MICRO1_ALIASES: Record<string, string> = {
  'Muse Wonder 1.0': 'muse-wonder',
};

/**
 * Rows from the first table on a micro1 report page whose header has a "Model" column and the score column
 * `scoreHead`. Scores below 1 are read as fractions and given as percents. An "Effort" column, when present,
 * gives the setting ("default" gives none). `metricHeads` (optional) maps other column headers to metrics
 * keys, scaled like the score; a key "ci" reads a "0.742 to 0.817" or "[0.469, 0.548]" cell as ciLow and ciHigh.
 */
export async function micro1Rows(page: string, scoreHead: string, metricHeads?: Record<string, string>, reasoningTokens = false): Promise<LeaderboardRow[]> {
  const all = tables(await fetchText(page));
  const t = all.find((rows) => rows[0]?.[0]?.text === 'Model' && rows[0].some((c) => c.text === scoreHead));
  if (!t) throw new Error(`no results table with a ${scoreHead} column on ${page}`);
  const head = t[0].map((c) => c.text);
  const iScore = head.indexOf(scoreHead);
  const iEffort = head.indexOf('Effort');
  const clean = (s: string) => s.replace(/[\s*†‡]+$/u, '').trim();
  const usage = new Map<string, number>();
  if (reasoningTokens) for (const table of all) {
    const modelAt = table[0]?.findIndex((c) => c.text === 'Model') ?? -1;
    const tokensAt = table[0]?.findIndex((c) => /^Reasoning tokens(?: \(k\))?$/i.test(c.text)) ?? -1;
    if (modelAt < 0 || tokensAt < 0) continue;
    const multiplier = /\(k\)/i.test(table[0][tokensAt].text) ? 1000 : 1;
    for (const row of table.slice(1)) {
      const name = clean(row[modelAt]?.text ?? '');
      const value = num(row[tokensAt]?.text);
      if (name && value !== undefined) usage.set(name, value * multiplier);
    }
  }
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    // footnote marks after the name: "Gemini 4 Argon*", "Muse Spark 1.3 †"
    const model = r[0]?.text.replace(/[\s*†‡]+$/u, '').trim();
    const cell = r[iScore]?.text ?? '';
    let score = num(cell);
    if (!model || score === undefined) continue;
    const scale = !cell.includes('%') && score <= 1 ? 100 : 1;
    if (scale !== 1) score = Number((score * scale).toFixed(2));
    const effort = iEffort >= 0 ? r[iEffort]?.text.split(',')[0].trim().toLowerCase() : undefined;
    const metrics: Record<string, number> = {};
    if (usage.has(model)) metrics.reasoningTokens = usage.get(model)!;
    for (const [h, key] of Object.entries(metricHeads ?? {})) {
      const c = r[head.indexOf(h)]?.text ?? '';
      const f = (x: string) => Number((Number(x) * (c.includes('%') ? 1 : scale)).toFixed(2));
      // "0.742 to 0.817", "0.742–0.817" or "[0.469, 0.548]"
      const ci = c.match(/(-?[\d.]+)\s*(?:to|–|-|,)\s*(-?[\d.]+)/);
      if (key === 'ci' && ci) Object.assign(metrics, { ciLow: f(ci[1]), ciHigh: f(ci[2]) });
      else if (key !== 'ci' && num(c) !== undefined) metrics[key] = f(String(num(c)));
    }
    rows.push({ model, score, setting: effort && effort !== 'default' ? effort : undefined, ...(Object.keys(metrics).length ? { metrics } : {}) });
  }
  if (!rows.length) throw new Error(`no rows in the results table on ${page}`);
  return rows;
}

interface Micro1Data {
  defaultTab?: string;
  tabs: { id: string; rows: { name: string; score: number }[] }[];
}

/**
 * Rows from the leaderboard card on a micro1 report page. Each page sets window.benchmarks_data["<key>"]
 * in an inline script, a literal with one or more tabs of { name, score } rows (scores 0 to 100), read here
 * as data, never run. Pages also carry other boards' cards, so the key must be the one the page's own
 * leaderboard element names (data-benchmark-id). The default tab is the card's headline; `tab` overrides it.
 */
export async function micro1Data(page: string, key: string, tab?: string): Promise<LeaderboardRow[]> {
  const html = await fetchText(page);
  if (!html.includes(`data-benchmark-id="${key}"`)) throw new Error(`no leaderboard ${key} on ${page}`);
  const marker = `window.benchmarks_data["${key}"] =`;
  const at = html.indexOf(marker);
  if (at < 0) throw new Error(`no data for ${key} on ${page}`);
  const data = jsLiteral<Micro1Data>(html, html.indexOf('{', at));
  const want = tab ?? data.defaultTab;
  // index cards keep their composite rows in a tab whose id differs from defaultTab
  const t = data.tabs.find((x) => x.id === want) ?? (data.tabs.length === 1 ? data.tabs[0] : undefined);
  if (!t?.rows?.length) throw new Error(`no rows in tab ${want} for ${key}`);
  return t.rows
    .map((r) => ({ model: r.name.replace(/[\s*†‡]+$/u, '').trim(), score: r.score }))
    .filter((r) => r.model && typeof r.score === 'number');
}

const PAGE = 'https://www.micro1.ai/benchmark/realm-pathology';

const board: Leaderboard = {
  benchmark: 'realmpathology',
  url: PAGE,
  feed: `${PAGE} (static HTML results table, Mean)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  fetch: () => micro1Rows(PAGE, 'Mean', { '95% CI': 'ci', 'Best of 3': 'bestOf3', 'Pass@3': 'passAt3' }, true),
};
export default board;
