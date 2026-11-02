// ArtifactsBench (Tencent Hunyuan). artifactsbenchmark.github.io/leaderboard.html is a React app whose
// bundle (static/js/main.<hash>.js) embeds each leaderboard tab as JSON.parse('{"performances": [...]}').
// The importer finds the bundle from the page, finds the data passed to the tab labeled "... | latest"
// (judge Gemini 2.5 Pro), and reads it as data, never runs it. AVG (0 to 100) is the score. The page
// footnote says a name ending in "*" marks numbers taken from technical reports or other third parties, so
// those rows are lab claims, not the board's own runs, and are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://artifactsbenchmark.github.io/leaderboard.html';
const BASE = 'https://artifactsbenchmark.github.io/';

interface Perf {
  AVG?: number | null;
  model?: string;
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
  benchmark: 'artifactsbench',
  url: PAGE,
  feed: `${BASE}static/js/main.<hash>.js (data of the "latest" tab)`,
  terms: 'Static GitHub Pages site with no robots.txt and no terms; the ArtifactsBenchmark repository is public and the scores are cited to Tencent Hunyuan.',
  aliases: {},
  async fetch() {
    const page = await fetchText(PAGE);
    const src = page.match(/src="\.?\/?(static\/js\/main\.[\w]+\.js)"/)?.[1];
    if (!src) throw new Error('ArtifactsBench bundle not found');
    const js = await fetchText(BASE + src);
    const name = js.match(/args:\[([\w$]+),"[^"]*\| latest"\]/)?.[1];
    if (!name) throw new Error('no "latest" tab in the ArtifactsBench bundle');
    const at = js.indexOf(`${name}=JSON.parse('`);
    if (at < 0) throw new Error(`no data for ${name}`);
    const data = JSON.parse(quoted(js, at + name.length + 12)) as { performances: Perf[] };
    const rows: LeaderboardRow[] = [];
    for (const p of data.performances) {
      const model = p.model?.trim();
      if (!model || typeof p.AVG !== 'number' || p.AVG <= 0) continue;
      if (/\*$/.test(model)) continue;
      rows.push({ model, score: p.AVG });
    }
    if (!rows.length) throw new Error('no rows in the ArtifactsBench latest tab');
    return rows;
  },
};
export default board;
