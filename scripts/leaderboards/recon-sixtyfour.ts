// RECON measures how accurately AI research systems find and verify facts about real people.
// This importer reads Sixtyfour's public full-results table, where weighted accuracy is the headline score and
// precision, recall, and correct, wrong, and missing counts are reported for the same 514 verified fields.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.sixtyfour.ai/recon-benchmark';
const board: Leaderboard = {
  benchmark: 'recon-sixtyfour',
  url: PAGE,
  feed: `${PAGE} (Table 1: Full results)`,
  terms: 'Sixtyfour publishes the benchmark results under its terms of service. https://www.sixtyfour.ai/legal/terms-of-service',
  stats: { correct:{name:'Correct fields',unit:'count',better:'higher'}, wrong:{name:'Wrong fields',unit:'count'}, missing:{name:'Missing fields',unit:'count'} },
  parts: {
    precision: { name: 'Precision', unit: '%' },
    recall: { name: 'Recall', unit: '%' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const table = html.match(/<div class="btable"[^>]*aria-label="RECON full results"[\s\S]*?<\/table>/)?.[0];
    if (!table) throw new Error('RECON: full-results table missing');
    const rows: LeaderboardRow[] = [];
    for (const match of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const row = match[1];
      const name = row.match(/<span class="sys__name"><b>([^<]+)<\/b>/)?.[1]?.trim();
      if (!name) continue;
      const cells = [...row.matchAll(/<td class="num">([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      if (cells.length < 4) throw new Error(`RECON: incomplete row for ${name}`);
      const values = cells.slice(0, 3).map((cell) => Number(cell.replace(/<[^>]+>/g, '').replace('%', '').trim()));
      if (values.some((v) => !Number.isFinite(v))) throw new Error(`RECON: invalid metrics for ${name}`);
      const counts = cells[3].replace(/<[^>]+>/g, ' ').match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
      if (!counts) throw new Error(`RECON: missing counts for ${name}`);
      rows.push({ model: name, score: values[0], metrics: { precision: values[1], recall: values[2], correct: Number(counts[1]), wrong: Number(counts[2]), missing: Number(counts[3]) } });
    }
    if (rows.length < 20) throw new Error(`RECON: ${rows.length} rows, expected at least 20`);
    return rows;
  },
};
export default board;
