// Historical ArtifactsBench board with the Gemini 2.5 Pro 0506 judge.
// ArtifactsBench (Tencent Hunyuan). artifactsbenchmark.github.io/leaderboard.html is a React app whose
// bundle (static/js/main.<hash>.js) embeds each leaderboard tab as JSON.parse('{"performances": [...]}').
// The importer finds the bundle from the page, finds the data passed to the tab labeled "... | history"
// (judge Gemini 2.5 Pro 0506), and reads it as data, never runs it. AVG (0 to 100) is the score. The page
// footnote says a name ending in "*" marks numbers taken from technical reports or other third parties, so
// those rows are lab claims, not the board's own runs, and are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://artifactsbenchmark.github.io/leaderboard.html';
const BASE = 'https://artifactsbenchmark.github.io/';

interface Perf {
  AVG?: number | null;
  model?: string;
  IFLEN?: number | null;
  [key: string]: string | number | null | undefined;
}

/** The JSON text inside a single-quoted JavaScript string literal that starts at `from`. */
function quoted(s: string, from: number): string {
  let out = '';
  for (let i = from + 1; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') {
      const n = s[++i];
      out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
      continue;
    }
    if (c === "'") return out;
    out += c;
  }
  throw new Error('unterminated string');
}

const board: Leaderboard = {
  benchmark: 'artifactsbench-gemini-0506',
  url: PAGE,
  feed: `${BASE}static/js/main.<hash>.js (data of the "history" tab)`,
  terms: 'Static GitHub Pages site with no robots.txt and no terms; the ArtifactsBenchmark repository is public and the scores are cited to Tencent Hunyuan.',
  aliases: {
    'Claude Sonnet 4 (20250514)': 'claude-sonnet-4',
    'Claude 3.7 Sonnet (20250219)': 'claude-3-7-sonnet',
    'Claude 3.5 Sonnet (20241022)': 'claude-3-5-sonnet-october-2024',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-Coder-480B-A35B-Instruct': 'qwen3-coder-480b-a35b',
    // plain Kimi-K2-Instruct is the July 2025 release (the September update is named 0905)
    'Kimi K2 Instruct': 'kimi-k2-jul-2025',
  },
  async fetch() {
    const page = await fetchText(PAGE);
    const src = page.match(/src="\.?\/?(static\/js\/main\.[\w]+\.js)"/)?.[1];
    if (!src) throw new Error('ArtifactsBench bundle not found');
    const js = await fetchText(BASE + src);
    const name = js.match(/args:\[([\w$]+),"[^"]*\| history"\]/)?.[1];
    if (!name) throw new Error('no "history" tab in the ArtifactsBench bundle');
    const at = js.indexOf(`${name}=JSON.parse('`);
    if (at < 0) throw new Error(`no data for ${name}`);
    const data = JSON.parse(quoted(js, at + name.length + 12)) as { performances: Perf[] };
    const rows: LeaderboardRow[] = [];
    for (const p of data.performances) {
      const model = p.model?.trim();
      if (!model || typeof p.AVG !== 'number' || p.AVG <= 0) continue;
      if (/\*$/.test(model)) continue;
      const metrics = Object.fromEntries(Object.entries(p).filter(([key, value]) =>
        !['AVG', 'IFLEN', 'model'].includes(key) && typeof value === 'number')) as Record<string, number>;
      // IFLEN is the board's average generated inference length, in tokens.
      rows.push({ model, score: p.AVG, tokens: typeof p.IFLEN === 'number' ? p.IFLEN : undefined, metrics });
    }
    if (!rows.length) throw new Error('no rows in the ArtifactsBench history tab');
    return rows;
  },
};
export default board;
