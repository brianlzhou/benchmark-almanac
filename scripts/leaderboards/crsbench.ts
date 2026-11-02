// CRSBench (Georgia Tech SSLab, OpenSSF OSS-CRS). oss-crs.openssf.org/crsbench/results is a static Docusaurus
// page with three tables. The one with Find, Fix and End-to-End columns (51 vulnerabilities) is the board that
// compares coding agents with one model each and is sorted by End-to-End by default, so End-to-End is the
// score: vulnerabilities both found and fixed, as a percent of 51, computed from the printed counts
// ("(35/51)") because the bar label is rounded. The agent CLI (<strong>) is the harness, the model is the
// lb__model span, and the E2E $/trial column is the cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://oss-crs.openssf.org/crsbench/results';

const board: Leaderboard = {
  benchmark: 'crsbench',
  url: PAGE,
  feed: `${PAGE} (static HTML, Find / Fix / End-to-End table, End-to-End)`,
  terms: 'Static OpenSSF project page; oss-crs.openssf.org has no robots.txt (404) and the OSS-CRS repository is MIT-licensed.',
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /end-to-end/i.test(c.text)));
    if (!t) throw new Error('End-to-End table not found');
    const head = t[0].map((c) => c.text.replace(/[^\w$/ -]/g, '').trim().toLowerCase());
    const iE2E = head.findIndex((h) => h.startsWith('end-to-end'));
    const iCost = head.findIndex((h, i) => i > iE2E && h.includes('$/trial'));
    if (iE2E < 0) throw new Error(`unexpected columns: ${head.join(', ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const harness = text(r[0]?.html.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? '');
      const model = text(r[0]?.html.match(/class="lb__model">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const counts = r[iE2E]?.text.match(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/);
      if (!model || !counts) continue;
      rows.push({ model, harness, score: (Number(counts[1]) / Number(counts[2])) * 100, cost: iCost >= 0 ? num(r[iCost]?.text) : undefined });
    }
    return rows;
  },
};
export default board;
