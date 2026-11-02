// Omni Parse Bench (Datalab). The results table is markdown under "## Results" in the omni_parse_bench
// README: per parser its weights, parameters, the headline score (0 to 100, the ranking), cost in US dollars
// per 1,000 pages, and text, tables and layout scores. The headline column is the score; rows marked
// "none" (no layout support) are skipped. A page is one task, so the cost per task is the per-1,000-pages
// price divided by 1,000. A trailing "*" (models used to make or check some tests) is dropped from names.
// Most rows are parsing products and OCR models; the general models (GPT, Claude, Gemini) match.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/datalab-to/omni_parse_bench/main/README.md';

const board: Leaderboard = {
  benchmark: 'omniparsebench',
  url: 'https://github.com/datalab-to/omni_parse_bench',
  feed: `${FEED} (Results table, headline)`,
  terms: 'README table in the datalab-to/omni_parse_bench repository (code Apache-2.0); only the published numbers are read.',
  async fetch() {
    const md = await fetchText(FEED);
    const lines = md.slice(md.indexOf('## Results')).split('\n').filter((l) => l.startsWith('|'));
    const split = (l: string) => l.split('|').slice(1, -1).map((c) => c.trim());
    const head = split(lines[0] ?? '');
    const [iName, iHead, iCost] = [head.indexOf('parser'), head.indexOf('headline'), head.indexOf('USD / 1,000 pages')];
    if (iName < 0 || iHead < 0) throw new Error(`unexpected Omni Parse Bench columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(2)) {
      const c = split(line);
      if (c.length !== head.length) break;
      const score = /\d/.test(c[iHead]) ? num(c[iHead]) : undefined;
      const perK = iCost >= 0 && /\d/.test(c[iCost]) ? num(c[iCost]) : undefined;
      if (!c[iName] || score === undefined) continue;
      rows.push({ model: c[iName].replace(/\s*\*$/, ''), score, cost: perK !== undefined ? perK / 1000 : undefined });
    }
    return rows;
  },
};
export default board;
